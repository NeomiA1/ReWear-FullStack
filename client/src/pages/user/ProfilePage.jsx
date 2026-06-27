import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import BottomNav from "../../components/BottomNav";
import { getDonationBagsByUserId } from "../../services/donationBagService";
import {
  createDonationRequest,
  linkBagToDonationRequest
} from "../../services/donationRequestService";
import { getAssociations } from "../../services/associationService";
import { updateDefaultPickupAddress } from "../../services/userService";
import { scoreAssociation } from "../../utils/matchScore";

function scoreBadgeClass(score) {
  if (score >= 80) return "bg-green-50 text-green-600";
  if (score >= 50) return "bg-amber-50 text-amber-600";
  return "bg-red-50 text-red-400";
}

export default function ProfilePage() {
  const navigate = useNavigate();

  // שליפת שקים מהשרת במקום מה- Context/localStorage
  const { user, logout, getOrgSettings } = useUser();
  
  const [selectedBag, setSelectedBag] = useState(null);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [search, setSearch] = useState("");
  const [sent, setSent] = useState(false);
  const [serverBags, setServerBags] = useState([]);
  const [orgs, setOrgs] = useState([]);

  const [contactPhone,   setContactPhone]   = useState(user?.phone ?? "");
  const [deliveryMethod, setDeliveryMethod] = useState("SelfArrival");
  const [pickupAddress,  setPickupAddress]  = useState("");
  const [saveAsDefault,  setSaveAsDefault]  = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const loadBags = async () => {
      if (!user || !user.userId) return;
      try {
        const bagsFromServer = await getDonationBagsByUserId(user.userId);
        setServerBags(bagsFromServer);
      } catch (error) {
        console.error(error);
      }
    };

    const loadOrgs = async () => {
      try {
        const data = await getAssociations();
        setOrgs(data.map(a => ({
          id:           a.associationId,
          name:         a.associationName,
          city:         a.city  ?? "",
          area:         a.area  ?? "",
          types:        a.associationType ?? a.description ?? "",
          deliveryMode: a.deliveryMode ?? "",
        })));
      } catch (error) {
        console.error(error);
      }
    };

    loadBags();
    loadOrgs();
  }, [user]);

  // איפוס פרטי המסירה בכל בחירת עמותה חדשה
  useEffect(() => {
    if (!selectedOrg) return;
    setDeliveryMethod("SelfArrival");
    setPickupAddress(user?.defaultPickupAddress ?? "");
    setSaveAsDefault(false);
  }, [selectedOrg]);

  const displayedOrgs = useMemo(() => {
    const filtered = orgs.filter(org =>
      org.name.toLowerCase().includes(search.toLowerCase())
    );

    // No bag selected → no scores; keep existing order of orgs.
    if (!selectedBag) {
      return filtered.map(org => ({ ...org, score: null, reasons: [] }));
    }

    // Bridge the city/location naming gap on the user object.
    const userCity = user?.city ?? user?.location ?? "";

    return filtered
      .map(org => {
        const { score, reasons } = scoreAssociation(selectedBag, org, { city: userCity });
        return { ...org, score, reasons };
      })
      .sort((a, b) => b.score - a.score);
  }, [orgs, search, selectedBag, user]);

  const handleSendToOrg = async () => {
    if (!selectedBag || !selectedOrg || !user) return;

    if (!contactPhone.trim()) {
      alert("נדרש טלפון ליצירת קשר");
      return;
    }
    if (deliveryMethod === "Pickup" && !pickupAddress.trim()) {
      alert("נדרשת כתובת לאיסוף");
      return;
    }

    try {
      const request = {
        userId:        user.userId,
        bagId:         selectedBag.id,
        associationId: selectedOrg.id,
        deliveryMethod,
        status:        "Pending",
        contactPhone:  contactPhone.trim(),
        pickupAddress: deliveryMethod === "Pickup" ? pickupAddress.trim() : null,
      };

      const result = await createDonationRequest(request);

      await linkBagToDonationRequest(result.requestId, selectedBag.id);

      if (saveAsDefault && deliveryMethod === "Pickup") {
        try {
          await updateDefaultPickupAddress(user.userId, pickupAddress.trim());
        } catch {
          // best-effort — לא מפילים את הזרימה הראשית
        }
      }

      setShowConfirmModal(false);
      setSent(true);

      setTimeout(() => {
        setSent(false);
        setSelectedBag(null);
        setSelectedOrg(null);
        setContactPhone(user?.phone ?? "");
        setDeliveryMethod("SelfArrival");
        setPickupAddress("");
        setSaveAsDefault(false);
      }, 3000);
    } catch (error) {
      console.error(error);
      alert(error);
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

  // זמינות איסוף נקבעת מהגדרות העמותה (getOrgSettings), לא מאובייקט העמותה עצמו
  const selectedOrgAcceptsPickup = selectedOrg
    ? getOrgSettings(selectedOrg.name).acceptsPickup
    : false;

  return (
    <div className="min-h-screen bg-rw-bg pb-28 overflow-y-auto">

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
            <p className="text-2xl font-bold text-rw-title">{allBags.length}</p>
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
              {allBags.map((bag) => (
                <div key={bag.id}
                  onClick={() => {
                    if (selectedBag?.id === bag.id) {
                      setSelectedBag(null);
                      setSelectedOrg(null);
                      setShowConfirmModal(false);
                    } else {
                      setSelectedBag(bag);
                    }
                  }}
                  className={`bg-rw-card rounded-2xl p-4 shadow-sm
                             flex items-center justify-between cursor-pointer
                             border-2 transition-all
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
                    {selectedBag?.id === bag.id && (
                      <span className="text-rw-btn text-lg">✓</span>
                    )}
                    <span className="text-2xl">🛍️</span>
                  </div>
                </div>
              ))}
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
            {displayedOrgs.map((org) => {
              const settings = getOrgSettings(org.name);
              return (
                <div key={org.id}
                  onClick={() => {
                    if (!selectedBag) { alert("יש לבחור שק לפני בחירת עמותה"); return; }
                    if (selectedOrg?.id === org.id) {
                      setSelectedOrg(null);
                    } else {
                      setSelectedOrg(org);
                    }
                  }}
                  className={`bg-rw-card rounded-2xl shadow-sm p-4
                             flex flex-col gap-2 cursor-pointer border-2 transition-all
                             ${selectedOrg?.id === org.id
                               ? "border-rw-btn"
                               : "border-transparent"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {selectedOrg?.id === org.id && (
                        <span className="text-rw-btn text-lg">✓</span>
                      )}
                      {org.score != null && (
                        <span className="relative group" tabIndex={0}>
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold
                                           cursor-default ${scoreBadgeClass(org.score)}`}>
                            {org.score}% התאמה
                          </span>
                          <span className="absolute top-full mt-1 right-0 z-10
                                           w-max max-w-[200px] text-right
                                           bg-rw-title text-white text-xs rounded-xl px-3 py-2
                                           opacity-0 group-hover:opacity-100 group-focus-within:opacity-100
                                           transition-opacity duration-150 pointer-events-none
                                           whitespace-normal leading-relaxed">
                            {org.reasons?.length > 0
                              ? org.reasons.join(" · ")
                              : "התאמה בסיסית לפי נתונים זמינים"}
                          </span>
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-rw-title text-sm">{org.name}</span>
                  </div>
                  <span className="text-xs text-rw-sub text-right">
                    📍 {org.city} · {org.area}
                  </span>
                  <span className="text-xs text-rw-sub text-right">{org.types}</span>
                  {org.reasons?.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-end mt-1">
                      {org.reasons.map((r) => (
                        <span key={r} className="text-xs text-rw-sub">• {r}</span>
                      ))}
                    </div>
                  )}
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

      </div>

      {/* CTA צף — המשך לשליחה */}
      {selectedBag && selectedOrg && !sent && !showConfirmModal && (
        <div dir="rtl"
          className="fixed bottom-20 inset-x-0 z-40 flex justify-center pointer-events-none">
          <button onClick={() => setShowConfirmModal(true)}
            className="pointer-events-auto bg-rw-btn text-white rounded-full
                       px-8 py-3 text-sm font-semibold shadow-lg
                       active:bg-rw-btn-hover">
            המשך
          </button>
        </div>
      )}

      {/* מודאל תיאום מסירה ושליחה */}
      {showConfirmModal && selectedBag && selectedOrg && (
        <div
          onClick={() => { setShowConfirmModal(false); setSelectedOrg(null); }}
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
            className="bg-rw-card rounded-2xl shadow-xl w-full max-w-sm p-5
                       flex flex-col gap-4 max-h-[85vh] overflow-y-auto text-right">

            {/* כותרת + סגירה */}
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => { setShowConfirmModal(false); setSelectedOrg(null); }}
                className="text-rw-sub text-xl leading-none">✕</button>
              <h3 className="font-bold text-rw-title text-base">תיאום מסירה</h3>
            </div>

            {/* סיכום */}
            <div className="flex flex-col gap-1 text-right">
              <p className="text-sm text-rw-title font-semibold">סיכום</p>
              <p className="text-xs text-rw-sub">
                שק: {[selectedBag.size, selectedBag.gender, selectedBag.condition]
                  .filter(Boolean).join(" · ")}
              </p>
              <p className="text-xs text-rw-sub">
                עמותה: {selectedOrg.name} – {selectedOrg.city}
              </p>
            </div>

            {/* שיטת מסירה — רק אם העמותה תומכת באיסוף */}
            {selectedOrgAcceptsPickup && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-bold text-rw-title text-right">שיטת מסירה</p>
                <div className="flex gap-2">
                  <button type="button"
                    onClick={() => {
                      setDeliveryMethod("Pickup");
                      setPickupAddress(user?.defaultPickupAddress ?? "");
                    }}
                    className={`flex-1 rounded-xl py-2.5 text-xs font-semibold border
                      ${deliveryMethod === "Pickup"
                        ? "bg-rw-btn text-white border-rw-btn"
                        : "bg-rw-input text-rw-sub border-rw-border"}`}>
                    🚗 איסוף מהבית
                  </button>
                  <button type="button"
                    onClick={() => setDeliveryMethod("SelfArrival")}
                    className={`flex-1 rounded-xl py-2.5 text-xs font-semibold border
                      ${deliveryMethod === "SelfArrival"
                        ? "bg-rw-btn text-white border-rw-btn"
                        : "bg-rw-input text-rw-sub border-rw-border"}`}>
                    🏢 הגעה לעמותה
                  </button>
                </div>
              </div>
            )}

            {/* טלפון ליצירת קשר — תמיד */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-rw-title text-right">
                טלפון ליצירת קשר
              </label>
              <input type="tel" dir="ltr" placeholder="מספר טלפון"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="border border-rw-border rounded-xl px-4 py-2.5 text-sm
                           text-left outline-none bg-rw-input focus:border-rw-btn" />
            </div>

            {/* פרטי איסוף — רק במצב Pickup */}
            {deliveryMethod === "Pickup" && (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-rw-title text-right">
                    כתובת לאיסוף
                  </label>
                  <input type="text" placeholder="רחוב, מספר ועיר"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    className="border border-rw-border rounded-xl px-4 py-2.5 text-sm
                               text-right outline-none bg-rw-input focus:border-rw-btn" />
                </div>

                <label className="flex items-center justify-end gap-2 cursor-pointer">
                  <span className="text-xs text-rw-sub">שמירת כתובת לפעם הבאה</span>
                  <input type="checkbox"
                    checked={saveAsDefault}
                    onChange={(e) => setSaveAsDefault(e.target.checked)}
                    className="w-4 h-4 accent-rw-btn" />
                </label>
              </>
            )}

            {/* שליחה */}
            <button onClick={handleSendToOrg}
              className="w-full bg-rw-btn text-white rounded-xl py-3
                         text-sm font-semibold flex items-center justify-center gap-2
                         active:bg-rw-btn-hover">
              <span>📦</span>
              <span>{deliveryMethod === "Pickup" ? "שליחה ותיאום איסוף" : "אישור שליחה"}</span>
            </button>

            {/* ביטול */}
            <button type="button" onClick={() => { setShowConfirmModal(false); setSelectedOrg(null); }}
              className="w-full text-rw-sub text-sm font-semibold py-1">
              ביטול
            </button>
          </div>
        </div>
      )}

      <BottomNav active="profile" />
    </div>
  );
}
