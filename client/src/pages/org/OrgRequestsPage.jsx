import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import OrgBottomNav from "../../components/OrgBottomNav";
import PageContainer from "../../components/PageContainer";
import { useToast } from "../../hooks/useToast";
import { useNotifications } from "../../hooks/useNotifications";
import { getDonationStatusInfo } from "../../utils/statusLabels";
import {
  getAssociationDonationRequests,
  respondToDonationRequest,
  offerCollectionToStore,
  proposePickupOptions
} from "../../services/donationRequestService";
import { getAssociationCollaborationRequests } from "../../services/collaborationService";


const DAY_OPTIONS  = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי"];
const TIME_OPTIONS = ["08:00–10:00", "10:00–12:00", "12:00–14:00",
                      "14:00–16:00", "16:00–18:00", "18:00–20:00"];


function RequestCard({ req, activeStores, onApproveSelf, onApproveAssistance, onReject, onOfferStore, onProposePickup }) {
  const [choosingMode, setChoosingMode] = useState(false);
  const [selectedDays,  setSelectedDays]  = useState([]);
  const [selectedTimes, setSelectedTimes] = useState([]);
  const [showSchedule,  setShowSchedule]  = useState(false);
  const [sendingSchedule, setSendingSchedule] = useState(false);
  const toast = useToast();

  const toggleDay  = (d) => setSelectedDays(prev =>
    prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  const toggleTime = (t) => setSelectedTimes(prev =>
    prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const handleSendSchedule = async () => {
    if (!selectedDays.length || !selectedTimes.length) {
      toast.warning("אנא בחר/י לפחות יום ושעה אחד");
      return;
    }
    setSendingSchedule(true);
    try {
      await onProposePickup(req.requestId, selectedDays.join(","), selectedTimes.join(","));
      setShowSchedule(false);
      setSelectedDays([]);
      setSelectedTimes([]);
      toast.success("ימי ושעות האיסוף נשלחו לתורם/ת");
    } catch (err) {
      toast.error(typeof err === "string" ? err : "שגיאה בשליחת מועדי האיסוף");
    } finally {
      setSendingSchedule(false);
    }
  };

  const bagLabel  = [req.shortDescription, req.sizes, req.targetGender, req.clothesCondition]
    .filter(Boolean).join(" · ") || "שק תרומה";
  const donorName = req.donorName || "תורם";

  const needsAssistance = req.collectionMode === "AssistanceNeeded";
  const readyToSchedule =
    req.requestStatus === "Approved" &&
    (req.collectionMode === "Self" || req.assignmentStatus === "Accepted");
  const waitingOnStore =
    req.requestStatus === "Approved" && needsAssistance && req.assignmentStatus === "Offered";
  const needsStorePick =
    req.requestStatus === "Approved" && needsAssistance &&
    (!req.assignmentStatus || req.assignmentStatus === "Declined");

  const hasProposal  = Boolean(req.proposedPickupDays);
  const hasSelection = Boolean(req.selectedPickupDay);

  const statusKey = req.requestStatus === "Pending" ? "pending" : "approved";

  return (
    <div className="bg-rw-card rounded-2xl shadow-sm p-4 flex flex-col gap-3">

      {/* שורה עליונה */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-rw-logo
                        flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">
            {donorName.charAt(0)}
          </span>
        </div>
        <div className="flex flex-col items-end flex-1">
          <span className="font-bold text-rw-title text-sm">{donorName}</span>
          <span className="text-rw-sub text-xs">{bagLabel}</span>
          <span className="text-rw-sub text-[10px]">
            {new Date(req.requestDate).toLocaleDateString("he-IL")}
          </span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0
                         ${getDonationStatusInfo(statusKey).color}`}>
          {getDonationStatusInfo(statusKey).label}
        </span>
      </div>

      {/* ממתין: דחה / אשר */}
      {req.requestStatus === "Pending" && !choosingMode && (
        <div className="flex gap-2">
          <button onClick={() => onReject(req.requestId)}
            className="flex-1 border border-red-200 text-red-400 rounded-xl
                       py-2 text-xs font-semibold active:bg-red-50">
            דחה
          </button>
          <button onClick={() => setChoosingMode(true)}
            className="flex-1 bg-rw-btn text-white rounded-xl
                       py-2 text-xs font-semibold active:bg-rw-btn-hover">
            אשר בקשה
          </button>
        </div>
      )}

      {/* אחרי אישור ראשוני: איך יתבצע האיסוף */}
      {req.requestStatus === "Pending" && choosingMode && (
        <div className="flex flex-col gap-2 border-t border-rw-border pt-3">
          <p className="text-xs font-bold text-rw-title text-right">
            כיצד יתבצע האיסוף?
          </p>
          <div className="flex gap-2">
            <button onClick={() => onApproveSelf(req.requestId)}
              className="flex-1 border border-rw-border text-rw-title rounded-xl
                         py-2 text-xs font-semibold">
              נאסוף בעצמנו
            </button>
            <button onClick={() => onApproveAssistance(req.requestId)}
              className="flex-1 bg-rw-btn text-white rounded-xl
                         py-2 text-xs font-semibold active:bg-rw-btn-hover">
              דרוש סיוע באיסוף
            </button>
          </div>
        </div>
      )}

      {/* בחירת חנות שותפה (ראשונית או אחרי דחייה) */}
      {needsStorePick && (
        <div className="flex flex-col gap-2 border-t border-rw-border pt-3">
          <p className="text-xs font-bold text-rw-title text-right">
            {req.assignmentStatus === "Declined"
              ? "החנות דחתה — בחר/י חנות אחרת:"
              : "בחר/י חנות שותפה שתבצע את האיסוף:"}
          </p>
          {activeStores.length === 0 ? (
            <p className="text-rw-sub text-xs text-right">
              אין כרגע חנויות שותפות פעילות.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {activeStores.map(store => (
                <button key={store.storeId}
                  onClick={() => onOfferStore(req.requestId, store.storeId)}
                  className="flex items-center justify-between bg-rw-input
                             rounded-xl px-3 py-2">
                  <span className="text-rw-btn text-xs font-semibold">שלח/י הצעה</span>
                  <span className="text-rw-title text-xs font-semibold">{store.storeName}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ממתין לתגובת החנות */}
      {waitingOnStore && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          <p className="text-amber-600 text-xs text-right">
            ממתין/ה לתגובת {req.assignedStoreName}
          </p>
        </div>
      )}

      {/* התורם/ת בחר/ה מועד */}
      {readyToSchedule && hasSelection && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2">
          <p className="text-green-700 text-xs text-right font-semibold">
            נבחר מועד איסוף: {req.selectedPickupDay}, {req.selectedPickupTime}
          </p>
        </div>
      )}

      {/* ממתין לבחירת התורם/ת */}
      {readyToSchedule && hasProposal && !hasSelection && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          <p className="text-amber-600 text-xs text-right">
            ממתין/ה לבחירת מועד מהתורם/ת
          </p>
        </div>
      )}

      {/* מוכן לתיאום איסוף */}
      {readyToSchedule && !hasProposal && !showSchedule && (
        <button onClick={() => setShowSchedule(true)}
          className="w-full bg-rw-btn text-white rounded-xl py-2
                     text-xs font-semibold active:bg-rw-btn-hover">
          תיאום ימי ושעות איסוף
        </button>
      )}

      {readyToSchedule && !hasProposal && showSchedule && (
        <div className="flex flex-col gap-3 border-t border-rw-border pt-3">

          <p className="text-xs font-bold text-rw-title text-right">
            ימים אפשריים לאיסוף:
          </p>
          <div className="flex flex-wrap gap-2 justify-end">
            {DAY_OPTIONS.map(day => (
              <button key={day} onClick={() => toggleDay(day)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold
                           ${selectedDays.includes(day)
                             ? "bg-rw-btn text-white"
                             : "bg-rw-input text-rw-sub border border-rw-border"}`}>
                {day}
              </button>
            ))}
          </div>

          <p className="text-xs font-bold text-rw-title text-right">
            שעות אפשריות:
          </p>
          <div className="flex flex-wrap gap-2 justify-end">
            {TIME_OPTIONS.map(time => (
              <button key={time} onClick={() => toggleTime(time)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold
                           ${selectedTimes.includes(time)
                             ? "bg-rw-btn text-white"
                             : "bg-rw-input text-rw-sub border border-rw-border"}`}>
                {time}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={() => setShowSchedule(false)} disabled={sendingSchedule}
              className="flex-1 border border-rw-border text-rw-sub rounded-xl
                         py-2 text-xs font-semibold disabled:opacity-50">
              ביטול
            </button>
            <button onClick={handleSendSchedule} disabled={sendingSchedule}
              className="flex-1 bg-rw-btn text-white rounded-xl
                         py-2 text-xs font-semibold active:bg-rw-btn-hover
                         disabled:opacity-60">
              {sendingSchedule ? "שולח..." : "שלח אישור ✓"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrgRequestsPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { unreadCount } = useNotifications();
  const toast = useToast();

  const [requests, setRequests] = useState([]);
  const [activeStores, setActiveStores] = useState([]);

  const loadRequests = async () => {
    if (!user?.userId) return;
    try {
      const data = await getAssociationDonationRequests(user.userId);
      setRequests(data);
    } catch {
      // best-effort — leave the list as-is on failure
    }
  };

  const loadActiveStores = async () => {
    if (!user?.userId) return;
    try {
      const data = await getAssociationCollaborationRequests(user.userId);
      setActiveStores(
        data
          .filter(c => c.requestStatus === "Accepted")
          .map(c => ({ storeId: c.storeId, storeName: c.storeName }))
      );
    } catch {
      // best-effort
    }
  };

  useEffect(() => {
    loadRequests();
    loadActiveStores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId]);

  const pendingRequests    = requests.filter(r => r.requestStatus === "Pending");
  const inProgressRequests = requests.filter(r => r.requestStatus === "Approved");
  const approvedCount      = inProgressRequests.length;

  const handleApproveSelf = async (requestId) => {
    try {
      await respondToDonationRequest(requestId, "approved", null, "Self");
      await loadRequests();
    } catch (err) {
      toast.error(typeof err === "string" ? err : "שגיאה באישור הבקשה");
    }
  };

  const handleApproveAssistance = async (requestId) => {
    try {
      await respondToDonationRequest(requestId, "approved", null, "AssistanceNeeded");
      await loadRequests();
    } catch (err) {
      toast.error(typeof err === "string" ? err : "שגיאה באישור הבקשה");
    }
  };

  const handleReject = async (requestId) => {
    try {
      await respondToDonationRequest(requestId, "rejected");
      await loadRequests();
    } catch (err) {
      toast.error(typeof err === "string" ? err : "שגיאה בדחיית הבקשה");
    }
  };

  const handleOfferStore = async (requestId, storeId) => {
    try {
      await offerCollectionToStore(requestId, storeId);
      await loadRequests();
    } catch (err) {
      toast.error(typeof err === "string" ? err : "שגיאה בשליחת ההצעה לחנות");
    }
  };

  const handleProposePickup = async (requestId, proposedDays, proposedTimes) => {
    await proposePickupOptions(requestId, proposedDays, proposedTimes);
    await loadRequests();
  };

  const visibleRequests = [...pendingRequests, ...inProgressRequests];

  return (
    <PageContainer className="pb-24 overflow-y-auto" wide>

      <div className="bg-rw-card px-5 pt-6 pb-4 shadow-sm
                      flex items-center justify-between">
        <div className="flex flex-col items-end">
          <h1 className="font-bold text-rw-title text-base">בקשות תרומה</h1>
          <p className="text-rw-sub text-xs mt-0.5">
            {pendingRequests.length} בקשות ממתינות לאישור
          </p>
        </div>
        <div onClick={() => navigate("/org/notifications")}
          className="relative w-10 h-10 bg-rw-input rounded-xl
                     flex items-center justify-center cursor-pointer">
          <span className="text-lg">🔔</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500
                             text-white text-[10px] font-bold rounded-full
                             flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </div>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-4">

        {approvedCount > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-2xl
                          px-4 py-3 flex items-center justify-between">
            <span className="text-green-600 text-xs font-semibold cursor-pointer"
              onClick={() => navigate("/org/pickups")}>
              עברו לאיסופים ←
            </span>
            <span className="text-green-700 text-sm font-bold">
              ✅ {approvedCount} בקשות אושרו
            </span>
          </div>
        )}

        {visibleRequests.length > 0 ? (
          visibleRequests.map(req => (
            <RequestCard key={req.requestId} req={req} activeStores={activeStores}
              onApproveSelf={handleApproveSelf}
              onApproveAssistance={handleApproveAssistance}
              onReject={handleReject}
              onOfferStore={handleOfferStore}
              onProposePickup={handleProposePickup} />
          ))
        ) : (
          <div className="flex flex-col items-center gap-3 pt-16">
            <span className="text-5xl">🎉</span>
            <p className="font-bold text-rw-title text-base">אין בקשות ממתינות</p>
            <p className="text-rw-sub text-sm text-center">
              כשמשתמש ישלח בקשת תרומה – היא תופיע כאן.
            </p>
            <button onClick={() => navigate("/org/pickups")}
              className="mt-2 bg-rw-btn text-white rounded-xl
                         px-6 py-2.5 text-sm font-semibold">
              למסך האיסופים
            </button>
          </div>
        )}

      </div>

      <OrgBottomNav active="requests" />
    </PageContainer>
  );
}
