// src/pages/user/DonationStatusPage.jsx
// מסך סטטוס תרומות – timeline מלא של כל הבקשות

import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import BottomNav from "../../components/BottomNav";

const STATUS_STEPS = [
  { key: "pending",   label: "נשלחה בקשה",        icon: "📤" },
  { key: "approved",  label: "אושרה ע״י העמותה",   icon: "✅" },
  { key: "scheduled", label: "תואם איסוף",          icon: "📅" },
  { key: "collected", label: "נאסף בהצלחה",         icon: "🎉" },
];

const STATUS_ORDER = ["pending", "approved", "scheduled", "collected"];

function Timeline({ status }) {
  const currentIndex = STATUS_ORDER.indexOf(status);
  return (
    <div className="flex items-center gap-1 mt-3">
      {STATUS_STEPS.map((step, i) => {
        const isDone    = i <= currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={step.key} className="flex items-center flex-1">
            {/* עיגול */}
            <div className={`w-7 h-7 rounded-full flex items-center justify-center
                             text-xs shrink-0 transition-colors
                             ${isDone
                               ? "bg-rw-btn text-white"
                               : "bg-rw-border text-rw-sub"}`}>
              {isDone ? step.icon : "○"}
            </div>
            {/* קו מחבר */}
            {i < STATUS_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-0.5
                               ${i < currentIndex ? "bg-rw-btn" : "bg-rw-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function DonationCard({ donation, onSchedule, onMarkCollected }) {
  const bagLabel = donation.bag
    ? [donation.bag.size, donation.bag.gender, donation.bag.condition]
        .filter(Boolean).join(" · ")
    : "שק תרומה";

  const isApproved  = donation.status === "approved";
  const isScheduled = donation.status === "scheduled";
  const isCollected = donation.status === "collected";
  const isRejected  = donation.status === "rejected";

  return (
    <div className={`bg-rw-card rounded-2xl shadow-sm p-4 flex flex-col gap-3
                     ${isCollected || isRejected ? "opacity-60" : ""}`}>

      {/* שורה עליונה */}
      <div className="flex items-center justify-between">
        <span className="text-rw-sub text-xs">{donation.date}</span>
        <div className="flex flex-col items-end">
          <span className="font-bold text-rw-title text-sm">
            {donation.org?.name || "עמותה"}
          </span>
          <span className="text-rw-sub text-xs">{bagLabel}</span>
        </div>
      </div>

      {/* Timeline */}
      {!isRejected && <Timeline status={donation.status} />}

      {/* תוויות שלבים */}
      {!isRejected && (
        <div className="flex justify-between mt-1">
          {STATUS_STEPS.map(step => (
            <span key={step.key} className="text-[9px] text-rw-sub text-center flex-1">
              {step.label}
            </span>
          ))}
        </div>
      )}

      {/* נדחה */}
      {isRejected && (
        <div className="bg-red-50 rounded-xl px-3 py-2 text-center">
          <p className="text-red-400 text-xs font-semibold">הבקשה נדחתה על ידי העמותה</p>
        </div>
      )}

      {/* פרטי תיאום */}
      {donation.pickupTime && (
        <div className="bg-rw-input rounded-xl px-3 py-2 flex flex-col gap-1">
          <div className="flex justify-between">
            <span className="text-xs text-rw-sub">{donation.pickupTime}</span>
            <span className="text-xs font-medium text-rw-title">⏰ שעת איסוף</span>
          </div>
          {donation.pickupAddress && (
            <div className="flex justify-between">
              <span className="text-xs text-rw-sub">{donation.pickupAddress}</span>
              <span className="text-xs font-medium text-rw-title">📍 כתובת</span>
            </div>
          )}
        </div>
      )}

      {/* כפתורי פעולה */}
      <div className="flex gap-2">
        {isApproved && (
          <button onClick={() => onSchedule(donation.id)}
            className="flex-1 bg-rw-btn text-white rounded-xl
                       py-2 text-xs font-semibold active:bg-rw-btn-hover">
            תאמי איסוף ←
          </button>
        )}
        {isScheduled && (
          <button onClick={() => onMarkCollected(donation.id)}
            className="flex-1 bg-green-500 text-white rounded-xl
                       py-2 text-xs font-semibold active:bg-green-600">
            סמני כנמסר ✓
          </button>
        )}
      </div>
    </div>
  );
}

export default function DonationStatusPage() {
  const navigate = useNavigate();
  const { sentDonations, updateSentDonation } = useUser();

  const donations = sentDonations || [];
  const active    = donations.filter(d => !["collected","rejected"].includes(d.status));
  const done      = donations.filter(d =>  ["collected","rejected"].includes(d.status));

  const handleMarkCollected = (id) => {
    updateSentDonation(id, { status: "collected" });
  };

  return (
    <div className="min-h-screen bg-rw-bg pb-24 overflow-y-auto">

      {/* Header */}
      <div className="sticky top-0 bg-rw-bg z-10
                      flex items-center justify-between
                      px-5 py-4 border-b border-rw-border">
        <button onClick={() => navigate("/home")} className="text-rw-sub text-2xl">→</button>
        <h1 className="font-bold text-rw-title text-base">סטטוס תרומות</h1>
        <div className="w-6" />
      </div>

      <div className="px-5 pt-5 flex flex-col gap-4">

        {/* בקשות פעילות */}
        {active.length > 0 && (
          <div>
            <h2 className="font-bold text-rw-title text-sm mb-3">
              פעילות ({active.length})
            </h2>
            <div className="flex flex-col gap-3">
              {active.map(d => (
                <DonationCard key={d.id} donation={d}
                  onSchedule={(id) => navigate(`/pickup/${id}`)}
                  onMarkCollected={handleMarkCollected} />
              ))}
            </div>
          </div>
        )}

        {/* היסטוריה */}
        {done.length > 0 && (
          <div>
            <h2 className="font-bold text-rw-title text-sm mb-3 opacity-60">
              היסטוריה ({done.length})
            </h2>
            <div className="flex flex-col gap-3">
              {done.map(d => (
                <DonationCard key={d.id} donation={d}
                  onSchedule={(id) => navigate(`/pickup/${id}`)}
                  onMarkCollected={handleMarkCollected} />
              ))}
            </div>
          </div>
        )}

        {/* ריק */}
        {donations.length === 0 && (
          <div className="flex flex-col items-center gap-4 pt-20">
            <span className="text-5xl">📦</span>
            <p className="font-bold text-rw-title text-base">אין תרומות עדיין</p>
            <p className="text-rw-sub text-sm text-center">
              העלי שק תרומה ושלחי אותו לעמותה כדי להתחיל
            </p>
            <button onClick={() => navigate("/upload")}
              className="bg-rw-btn text-white rounded-xl px-6 py-3 text-sm font-semibold">
              העלי שק ראשון
            </button>
          </div>
        )}

      </div>

      <BottomNav active="status" />
    </div>
  );
}
