import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import BottomNav from "../../components/BottomNav";
import { getDonationBagsByUserId } from "../../services/donationBagService";
import {
  createDonationRequest,
  linkBagToDonationRequest
} from "../../services/donationRequestService";
import { checkAssociationExists } from "../../services/associationService";

// TODO(server): these are placeholder organizations for browsing — there is
// no GET /api/associations (list/search) endpoint yet, so the client can't
// show real organizations from the database. Before actually sending a
// donation request we try to resolve each one against the real DB via
// checkAssociationExists(name, email); if that fails we fall back to a
// local-only "demo" send instead of corrupting real data with a fake id.
const MOCK_ORGS = [
  { id: 1, name: "ויצו",      email: "vizo@example-demo.org",     city: "תל אביב",  types: "בגדי נשים, ילדים",  area: "מרכז"    },
  { id: 2, name: "נעמת",      email: "naamat@example-demo.org",   city: "חיפה",     types: "כל סוגי הבגדים",    area: "צפון"    },
  { id: 3, name: "לתת",       email: "latet@example-demo.org",    city: "ירושלים",  types: "בגדי חורף, מעילים", area: "ירושלים" },
  { id: 4, name: "יד שרה",    email: "yadsarah@example-demo.org", city: "באר שבע",  types: "בגדים לקשישים",     area: "דרום"    },
  { id: 5, name: "קרן חיים",  email: "keren@example-demo.org",    city: "רמת גן",   types: "בגדי ילדים",        area: "מרכז"    },
];

export default function ProfilePage() {
  const navigate = useNavigate();

  // שליפת שקים מהשרת במקום מה- Context/localStorage
  const { user, logout, getOrgSettings } = useUser();
  
  const [selectedBag, setSelectedBag] = useState(null);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [search, setSearch] = useState("");
  const [sent, setSent] = useState(false);
  const [sentAsDemo, setSentAsDemo] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [sending, setSending] = useState(false);
  const [serverBags, setServerBags] = useState([]);
  // שקים שכבר נשלחו לעמותה בסשן הנוכחי — מונע שליחה כפולה של אותו שק
  const [sentBagIds, setSentBagIds] = useState([]);

  useEffect(() => {
    const loadBags = async () => {
      if (!user || !user.userId) return;
  
      try {
        const bagsFromServer = await getDonationBagsByUserId(user.userId);

        console.log("Bags from API:", bagsFromServer);
        
        setServerBags(bagsFromServer);
      } catch (error) {
        console.error(error);
      }
    };
  
    loadBags();
  }, [user]);

  const filteredOrgs = MOCK_ORGS.filter(org =>
    org.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSendToOrg = async () => {
    if (!selectedBag || !selectedOrg || !user) return;

    if (sentBagIds.includes(selectedBag.id)) {
      setSendError("השק הזה כבר נשלח לעמותה. לא ניתן לשלוח את אותו שק פעמיים.");
      return;
    }

    setSendError(null);
    setSending(true);

    try {
      // מנסים לאתר את העמותה האמיתית במסד הנתונים (התאמה מדויקת של שם+מייל —
      // ראו TODO(server) למעלה, אין endpoint לרשימת עמותות אמיתית).
      let realAssociation = null;
      try {
        realAssociation = await checkAssociationExists(selectedOrg.name, selectedOrg.email);
      } catch {
        realAssociation = null; // כל כשל בבדיקה → נופלים חזרה למצב הדגמה
      }

      if (realAssociation) {
        if (!realAssociation.isAvailable) {
          setSendError("העמותה אינה זמינה לקבלת תרומות כרגע.");
          setSending(false);
          return;
        }

        const request = {
          userId: user.userId,
          bagId: selectedBag.id,
          associationId: realAssociation.associationId,
          deliveryMethod: "SelfArrival",
          status: "Pending"
        };

        const result = await createDonationRequest(request);
        await linkBagToDonationRequest(result.requestId, selectedBag.id);
        setSentAsDemo(false);
      } else {
        // עמותה זו אינה רשומה במסד הנתונים האמיתי (ראו TODO(server) למעלה) —
        // לא ניתן לשלוח בקשה אמיתית בלי מזהה תקין, ממשיכים במצב הדגמה מקומי.
        if (!getOrgSettings(selectedOrg.name).isAvailable) {
          setSendError("העמותה אינה זמינה לקבלת תרומות כרגע.");
          setSending(false);
          return;
        }
        setSentAsDemo(true);
      }

      setSentBagIds(prev => [...prev, selectedBag.id]);
      setSent(true);

      setTimeout(() => {
        setSent(false);
        setSelectedBag(null);
        setSelectedOrg(null);
      }, 3000);
    } catch (error) {
      console.error(error);
      setSendError(typeof error === "string" ? error : "שגיאה בשליחת הבקשה. נסי שוב.");
    } finally {
      setSending(false);
    }
  };

  if (!user) return null;

  // שליפת שקים מה- API
  const allBags = (serverBags || []).map((bag, index) => ({
    id: bag.bagId,
    size: bag.sizes || "",
    gender: bag.targetGender || "",
    condition: bag.clothesCondition || "",
    description: bag.shortDescription || "",
    imagePreview: null,
    donationDate: bag.createdAt
      ? new Date(bag.createdAt).toLocaleDateString("he-IL")
      : "",
    index: index + 1,
  }));

  return (
    <div className="min-h-screen bg-rw-bg pb-24 overflow-y-auto">

      {/* Header */}
      <div className="bg-rw-card px-5 pt-8 pb-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => { logout(); navigate("/"); }}
            className="text-xs text-rw-sub border border-rw-border
                       rounded-xl px-3 py-1.5 active:bg-rw-input">
            התנתקות
          </button>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <h1 className="font-bold text-rw-title text-lg">{user.fullName}</h1>
              <p className="text-rw-sub text-sm">{user.email}</p>
              {user.location && (
                <p className="text-rw-sub text-xs mt-0.5">📍 {user.location}</p>
              )}
            </div>
            <div className="w-16 h-16 rounded-full bg-rw-logo
                            flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {user.fullName?.charAt(0)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-rw-input rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-rw-title">{allBags.length}</p>
            <p className="text-xs text-rw-sub mt-1">שקים שנתרמו</p>
          </div>
          <div className="bg-rw-input rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-rw-title">{sentBagIds.length}</p>
            <p className="text-xs text-rw-sub mt-1">תרומות שנשלחו</p>
          </div>
        </div>
      </div>

      <div className="px-5 mt-5 flex flex-col gap-6">

        {/* הודעת הצלחה */}
        {sent && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4
                          flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-semibold text-green-700 text-sm">הבקשה נשלחה בהצלחה!</p>
              <p className="text-green-600 text-xs mt-0.5">
                {selectedOrg?.name} תיצור איתך קשר בקרוב
              </p>
              {sentAsDemo && (
                <p className="text-green-500 text-[11px] mt-0.5">
                  (מצב הדגמה — עמותה זו טרם רשומה במערכת האמיתית)
                </p>
              )}
            </div>
          </div>
        )}

        {/* שלב 1 – בחירת שק */}
        <div>
          <h2 className="font-bold text-rw-title text-base mb-3">
            שלב 1 – בחרי שק לשליחה
          </h2>

          {allBags.length === 0 ? (
            <div className="bg-rw-card rounded-2xl p-5 text-center shadow-sm">
              <p className="text-3xl mb-2">🛍️</p>
              <p className="text-rw-sub text-sm">עדיין לא העלית שקים</p>
              <button onClick={() => navigate("/upload")}
                className="mt-3 bg-rw-btn text-white rounded-xl px-4 py-2
                           text-sm font-semibold">
                העלי שק
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {allBags.map((bag) => {
                const alreadySent = sentBagIds.includes(bag.id);
                return (
                  <div key={bag.id}
                    onClick={() => { if (!alreadySent) { setSelectedBag(bag); setSendError(null); } }}
                    className={`bg-rw-card rounded-2xl p-4 shadow-sm
                               flex items-center justify-between
                               border-2 transition-all
                               ${alreadySent
                                 ? "opacity-50 cursor-not-allowed"
                                 : "cursor-pointer"}
                               ${selectedBag?.id === bag.id
                                 ? "border-rw-btn"
                                 : "border-transparent"}`}>

                    {/* תמונה אם יש */}
                    {bag.imagePreview && (
                      <img src={bag.imagePreview} alt="שק"
                        className="w-12 h-12 rounded-xl object-cover shrink-0 ml-3" />
                    )}

                    <div className="flex flex-col items-end gap-1 flex-1">
                      <span className="font-semibold text-rw-title text-sm">
                        שק {bag.index}
                      </span>
                      <span className="text-xs text-rw-sub">
                        {[bag.size, bag.gender, bag.condition].filter(Boolean).join(" · ")}
                      </span>
                      <span className="text-xs text-rw-sub">{bag.donationDate}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {alreadySent ? (
                        <span className="text-xs font-semibold text-rw-green">✓ נשלח</span>
                      ) : selectedBag?.id === bag.id ? (
                        <span className="text-rw-btn text-lg">✓</span>
                      ) : null}
                      <span className="text-2xl">🛍️</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* שלב 2 – בחירת עמותה */}
        <div>
          <h2 className="font-bold text-rw-title text-base mb-3">
            שלב 2 – בחרי עמותה
          </h2>

          <div className="flex gap-2 mb-3">
            <input type="text" placeholder="חיפוש לפי שם עמותה..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="flex-1 border border-rw-border rounded-xl px-4 py-2.5
                         text-sm text-right outline-none bg-rw-card focus:border-rw-btn" />
            <button onClick={() => navigate("/map")}
              className="bg-rw-card border border-rw-border rounded-xl px-3
                         flex items-center gap-1 text-rw-sub text-sm active:bg-rw-input">
              <span>🗺️</span><span>מפה</span>
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {filteredOrgs.map((org) => {
              const settings = getOrgSettings(org.name);
              return (
                <div key={org.id} onClick={() => { setSelectedOrg(org); setSendError(null); }}
                  className={`bg-rw-card rounded-2xl shadow-sm p-4
                             flex flex-col gap-2 cursor-pointer border-2 transition-all
                             ${selectedOrg?.id === org.id
                               ? "border-rw-btn"
                               : "border-transparent"}`}>
                  <div className="flex items-center justify-between">
                    {selectedOrg?.id === org.id && (
                      <span className="text-rw-btn text-lg">✓</span>
                    )}
                    <span className="font-semibold text-rw-title text-sm">{org.name}</span>
                  </div>
                  <span className="text-xs text-rw-sub text-right">
                    📍 {org.city} · {org.area}
                  </span>
                  <span className="text-xs text-rw-sub text-right">{org.types}</span>
                  <div className="flex flex-wrap gap-2 justify-end mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium
                      ${settings.isAvailable
                        ? "bg-green-50 text-green-600"
                        : "bg-red-50 text-red-400"}`}>
                      {settings.isAvailable ? "✓ זמינה לתרומות" : "✗ לא זמינה כרגע"}
                    </span>
                    {settings.acceptsPickup && (
                      <span className="text-xs px-2 py-1 rounded-full
                                       bg-blue-50 text-blue-500 font-medium">
                        🚗 איסוף מהבית
                      </span>
                    )}
                    {settings.acceptsDropoff && (
                      <span className="text-xs px-2 py-1 rounded-full
                                       bg-purple-50 text-purple-500 font-medium">
                        🏢 הגעה לעמותה
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* כפתור שליחה */}
        {selectedBag && selectedOrg && !sent && (
          <div className="bg-rw-card rounded-2xl shadow-sm p-4">
            <div className="flex flex-col gap-1 mb-4 items-end">
              <p className="text-sm text-rw-title font-semibold">סיכום:</p>
              <p className="text-xs text-rw-sub">
                שק: {[selectedBag.size, selectedBag.gender, selectedBag.condition]
                  .filter(Boolean).join(" · ")}
              </p>
              <p className="text-xs text-rw-sub">
                עמותה: {selectedOrg.name} – {selectedOrg.city}
              </p>
            </div>

            {sendError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 mb-3">
                <p className="text-red-600 text-xs text-right">{sendError}</p>
              </div>
            )}

            <button onClick={handleSendToOrg} disabled={sending}
              className="w-full bg-rw-btn text-white rounded-xl py-3
                         text-sm font-semibold flex items-center justify-center gap-2
                         active:bg-rw-btn-hover disabled:opacity-50">
              <span>{sending ? "⏳" : "📦"}</span>
              <span>{sending ? "שולחת..." : `שלחי תרומה ל${selectedOrg.name}`}</span>
            </button>
          </div>
        )}

      </div>

      <BottomNav active="profile" />
    </div>
  );
}
