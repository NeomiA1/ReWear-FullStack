import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import OrgBottomNav from "../../components/OrgBottomNav";
import PageContainer from "../../components/PageContainer";
import { useToast } from "../../hooks/useToast";

// TODO(server): this whole screen is demo-only local data (sentDonations in
// UserContext, not the real DonationRequests). A real org→approve/reject
// flow needs a server endpoint the org can use to discover its own pending
// requests — nothing like this exists today, e.g.:
//
//   GET /api/DonationRequests/association/{associationId}
//   → [{ requestId, associationId, bagId, donor: { name, city, ... },
//        status, userNote, associationResponse, createdAt }]
//
// The response endpoint itself (PUT /api/DonationRequests/{id}/response,
// wired in donationRequestService.js as respondToDonationRequest) already
// exists and works, but without the GET above there is no real, shared
// (cross-browser/device/user) way for an org to ever learn a requestId
// exists to call it with. Do NOT bridge this via localStorage — that would
// only work within one browser and would misrepresent this as a finished,
// multi-user flow. Once the GET endpoint exists, this page should fetch
// real pending requests and call respondToDonationRequest on approve/reject.

const DAY_OPTIONS  = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי"];
const TIME_OPTIONS = ["08:00–10:00", "10:00–12:00", "12:00–14:00",
                      "14:00–16:00", "16:00–18:00", "18:00–20:00"];

function RequestCard({ req, onApprove, onReject }) {
  const [selectedDays,  setSelectedDays]  = useState([]);
  const [selectedTimes, setSelectedTimes] = useState([]);
  const [showSchedule,  setShowSchedule]  = useState(false);
  const toast = useToast();

  const toggleDay  = (d) => setSelectedDays(prev =>
    prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  const toggleTime = (t) => setSelectedTimes(prev =>
    prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const handleApprove = () => {
    if (!selectedDays.length || !selectedTimes.length) {
      toast.warning("אנא בחרי לפחות יום ושעה אחד");
      return;
    }
    onApprove(req.id, selectedDays, selectedTimes);
  };

  const bagLabel   = req.bag
    ? [req.bag.size, req.bag.gender, req.bag.condition].filter(Boolean).join(" · ")
    : "שק תרומה";
  const donorName  = req.donor || req.bag?.donorName || "תורם";

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
          <span className="text-rw-sub text-[10px]">{req.date}</span>
        </div>
        <span className="bg-blue-50 text-blue-500 text-[10px] font-bold
                         px-2 py-0.5 rounded-full shrink-0">
          בקשה חדשה
        </span>
      </div>

      {!showSchedule ? (
        <div className="flex gap-2">
          <button onClick={() => onReject(req.id)}
            className="flex-1 border border-red-200 text-red-400 rounded-xl
                       py-2 text-xs font-semibold active:bg-red-50">
            דחה
          </button>
          <button onClick={() => setShowSchedule(true)}
            className="flex-1 bg-rw-btn text-white rounded-xl
                       py-2 text-xs font-semibold active:bg-rw-btn-hover">
            אשר בקשה
          </button>
        </div>
      ) : (
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
            <button onClick={() => setShowSchedule(false)}
              className="flex-1 border border-rw-border text-rw-sub rounded-xl
                         py-2 text-xs font-semibold">
              ביטול
            </button>
            <button onClick={handleApprove}
              className="flex-1 bg-rw-btn text-white rounded-xl
                         py-2 text-xs font-semibold active:bg-rw-btn-hover">
              שלח אישור ✓
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrgRequestsPage() {
  const navigate = useNavigate();
  const { sentDonations, updateSentDonation } = useUser();

  const pendingRequests = sentDonations.filter(d => d.status === "pending");
  const approvedCount   = sentDonations.filter(d => d.status === "approved").length;

  const handleApprove = (id, days, times) => {
    updateSentDonation(id, {
      status:         "approved",
      availableDays:  days,
      availableTimes: times,
    });
  };

  const handleReject = (id) => {
    updateSentDonation(id, { status: "rejected" });
  };

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
          className="w-10 h-10 bg-rw-input rounded-xl
                     flex items-center justify-center cursor-pointer">
          <span className="text-lg">🔔</span>
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

        {/* מסך זה כרגע מציג רק בקשות הדגמה מקומיות — ראו TODO(server) למעלה */}
        {pendingRequests.length > 0 && (
          <h2 className="font-bold text-rw-title text-sm text-right">
            בקשות הדגמה ({pendingRequests.length})
          </h2>
        )}
        {pendingRequests.length > 0 ? (
          pendingRequests.map(req => (
            <RequestCard key={req.id} req={req}
              onApprove={handleApprove}
              onReject={handleReject} />
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
