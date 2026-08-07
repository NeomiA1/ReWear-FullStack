import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import BottomNav from "../../components/BottomNav";
import PageContainer from "../../components/PageContainer";
import AssociationRecommendationList from "../../components/AssociationRecommendationList";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import {
  getDonationBagsByUserId,
  updateDonationBagStatus
} from "../../services/donationBagService";
import {
  createDonationRequest,
  linkBagToDonationRequest
} from "../../services/donationRequestService";
import { checkAssociationExists } from "../../services/associationService";
import { getUserDisplayName, getUserInitial } from "../../utils/userDisplay";
import { getBagStatusInfo } from "../../utils/statusLabels";
import { getBagCategory } from "../../utils/associationRecommendation";
import { getRecoProfile, recordAssociationSelected, recordDonatedCategory } from "../../utils/recommendationHistory";
import { recordDonationSent } from "../../utils/donationSendLog";

export default function ProfilePage() {
  const navigate = useNavigate();

  // שליפת שקים מהשרת במקום מה- Context/localStorage
  const { user, logout, getOrgSettings } = useUser();
  
  const [selectedBag, setSelectedBag] = useState(null);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [sent, setSent] = useState(false);
  const [sentAsDemo, setSentAsDemo] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [sending, setSending] = useState(false);
  const [serverBags, setServerBags] = useState([]);
  // שקים שכבר נשלחו לעמותה בסשן הנוכחי — מונע שליחה כפולה של אותו שק
  const [sentBagIds, setSentBagIds] = useState([]);
  const [loadingBags, setLoadingBags] = useState(false);
  const [bagsError, setBagsError] = useState(null);
  const { confirm, confirmDialogProps } = useConfirmDialog();

  useEffect(() => {
    const loadBags = async () => {
      if (!user || !user.userId) return;

      setLoadingBags(true);
      setBagsError(null);
      try {
        const bagsFromServer = await getDonationBagsByUserId(user.userId);
        setServerBags(bagsFromServer);
      } catch (error) {
        console.error(error);
        setBagsError("לא הצלחנו לטעון את השקים שלך. בדקי את החיבור ונסי שוב.");
      } finally {
        setLoadingBags(false);
      }
    };

    loadBags();
  }, [user]);

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
      let sentRequestId = null;
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
        sentRequestId = result.requestId;
        await linkBagToDonationRequest(result.requestId, selectedBag.id);

        // מעדכנים את סטטוס השק בשרת ל"ממתין לתגובת עמותה" — קריאה אמיתית,
        // עצמאית, מול Azure. אם זה נכשל, הבקשה עצמה כבר נשלחה בהצלחה, לא
        // מבטלים את הפעולה בגללו.
        //
        // TODO(server): אין עדיין דרך לעמותה לגלות את הבקשה הזו ולהגיב לה
        // מול השרת — חסר endpoint כמו
        //   GET /api/DonationRequests/association/{associationId}
        // שיחזיר לעמותה את רשימת הבקשות שהופנו אליה (requestId, bagId,
        // פרטי תורם מותרים, סטטוס, הודעת תורם, תגובת עמותה, תאריך יצירה).
        // בלי זה, אין דרך אמיתית ומשותפת (בין דפדפנים/מכשירים/משתמשים)
        // לעמותה לדעת שהבקשה הזו קיימת בכלל — ולכן לא הוספנו שום מנגנון
        // מקומי (localStorage וכד') שמדמה "גילוי" כזה; זה היה נראה כאילו
        // התהליך שלם בעוד שהוא בפועל חסום בצד השרת.
        try {
          await updateDonationBagStatus(selectedBag.id, "WaitingForAssociation");
          setServerBags(prev => prev.map(b =>
            b.bagId === selectedBag.id ? { ...b, status: "WaitingForAssociation" } : b
          ));
        } catch (statusError) {
          console.error("bag status update failed:", statusError);
        }

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

      // מזינים את מנוע ההמלצות: העמותה שנבחרה בפועל + קטגוריית השק שנשלח —
      // אותות "היסטוריה" ל-scoreAssociation.js, לא נתון עסקי משותף.
      if (user?.userId != null) {
        // הנושאים שסוננו בפועל בסשן הנוכחי — לא העדפות ה-onboarding. הפילטר
        // החי ב-AssociationRecommendationList כבר נכתב ל-lastFilters.causes
        // (synchronous, ראו saveLastFilters) בכל פעם שהמשתמשת בחרה/ביטלה
        // נושא, אז קריאה חוזרת שלו כאן משקפת בדיוק את מה שהיה פעיל.
        const activeCauseFilters = getRecoProfile(user.userId).lastFilters.causes || [];
        recordAssociationSelected(user.userId, selectedOrg.id, activeCauseFilters);
        recordDonatedCategory(user.userId, getBagCategory(selectedBag));

        // שונה מהותית מה-TODO(server) למעלה: זו לא סימולציה של "גילוי" ע"י
        // העמותה — זו רק זכירה של פעולה אמיתית שהדפדפן הזה עצמו ביצע (איזו
        // עמותה נבחרה ומתי), למסך "מסע התרומה" (DonationStatusPage).
        recordDonationSent(user.userId, selectedBag.id, {
          associationName: selectedOrg.name,
          associationId: realAssociation?.associationId ?? null,
          requestId: sentRequestId,
        });
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

  // בחירת עמותה חדשה כשכבר יש נבחרת — זו החלפה, לא בחירה ראשונית, אז
  // מאשרים לפני שמאבדים את הבחירה הקודמת. בחירה ראשונית (אין נבחרת עדיין)
  // או לחיצה חוזרת על אותה עמותה נשארות מיידיות — אין כאן שום דבר לאבד.
  const handleSelectOrg = (org) => {
    if (selectedOrg && selectedOrg.id !== org.id) {
      confirm({
        title: "החלפת עמותה",
        message: `העמותה שנבחרה תוחלף מ${selectedOrg.name} ל${org.name}.`,
        confirmText: "החליפי עמותה",
        cancelText: "ביטול",
        icon: "🔁",
        onConfirm: () => {
          setSelectedOrg(org);
          setSendError(null);
        },
      });
      return;
    }
    setSelectedOrg(org);
    setSendError(null);
  };

  const handleSendClick = () => {
    if (!selectedBag || !selectedOrg) return;
    confirm({
      title: "שליחת תרומה",
      message: `לשלוח את השק ל${selectedOrg.name}?`,
      confirmText: "כן, שלחי",
      cancelText: "ביטול",
      icon: "📦",
      onConfirm: handleSendToOrg,
    });
  };

  if (!user) return null;

  // שליפת שקים מה- API
  const allBags = (serverBags || []).map((bag, index) => ({
    id: bag.bagId,
    size: bag.sizes || "",
    age: bag.targetAges || "",
    gender: bag.targetGender || "",
    condition: bag.clothesCondition || "",
    description: bag.shortDescription || "",
    status: bag.status || "Draft",
    imagePreview: null,
    donationDate: bag.createdAt
      ? new Date(bag.createdAt).toLocaleDateString("he-IL")
      : "",
    index: index + 1,
  }));

  return (
    <PageContainer className="pb-24 overflow-y-auto" wide>

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
              <h1 className="font-bold text-rw-title text-lg">{getUserDisplayName(user)}</h1>
              <p className="text-rw-sub text-sm">{user.email}</p>
              {user.location && (
                <p className="text-rw-sub text-xs mt-0.5">📍 {user.location}</p>
              )}
            </div>
            <div className="w-16 h-16 rounded-full bg-rw-logo
                            flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {getUserInitial(user)}
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

          {loadingBags ? (
            <div className="bg-rw-card rounded-2xl p-5 text-center shadow-sm">
              <p className="text-3xl mb-2">⏳</p>
              <p className="text-rw-sub text-sm">טוענת את השקים שלך...</p>
              <p className="text-rw-sub text-[11px] mt-1">
                אם זו הפעם הראשונה היום, זה עשוי לקחת עד 30 שניות
              </p>
            </div>
          ) : bagsError ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
              <p className="text-3xl mb-2">⚠️</p>
              <p className="text-red-600 text-sm">{bagsError}</p>
            </div>
          ) : allBags.length === 0 ? (
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
            <div className="flex flex-col gap-2 md:grid md:grid-cols-2 xl:grid-cols-3 md:items-start">
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
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
                          ${getBagStatusInfo(bag.status).color}`}>
                          {getBagStatusInfo(bag.status).label}
                        </span>
                        <span className="font-semibold text-rw-title text-sm">
                          שק {bag.index}
                        </span>
                      </div>
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

          <div className="flex justify-end mb-3">
            <button onClick={() => navigate("/map")}
              className="bg-rw-card border border-rw-border rounded-xl px-3 py-2
                         flex items-center gap-1 text-rw-sub text-sm active:bg-rw-input">
              <span>🗺️</span><span>מפה</span>
            </button>
          </div>

          <AssociationRecommendationList
            bag={selectedBag}
            selectedId={selectedOrg?.id}
            onSelect={handleSelectOrg}
          />
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

            <button onClick={handleSendClick} disabled={sending}
              className="w-full bg-rw-btn text-white rounded-xl py-3
                         text-sm font-semibold flex items-center justify-center gap-2
                         active:bg-rw-btn-hover disabled:opacity-50">
              <span>{sending ? "⏳" : "📦"}</span>
              <span>{sending ? "שולחת..." : `שלחי תרומה ל${selectedOrg.name}`}</span>
            </button>
            {sending && (
              <p className="text-rw-sub text-[11px] text-center mt-2">
                אם זו הפעם הראשונה היום, החיבור לשרת עשוי לקחת עד 30 שניות
              </p>
            )}
          </div>
        )}

      </div>

      <ConfirmDialog {...confirmDialogProps} />
      <BottomNav active="profile" />
    </PageContainer>
  );
}
