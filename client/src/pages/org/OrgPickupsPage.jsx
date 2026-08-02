import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import OrgBottomNav from "../../components/OrgBottomNav";
import PageContainer from "../../components/PageContainer";
import { useState } from "react";
import { getDonationStatusInfo } from "../../utils/statusLabels";

const FILTERS = [
  { id: "all",       label: "הכל"     },
  { id: "approved",  label: "ממתינים" },
  { id: "scheduled", label: "תואמים"  },
  { id: "collected", label: "נאספו"   },
];

function PickupCard({ pickup, onCollect, onCancel }) {
  const statusInfo = getDonationStatusInfo(pickup.status);
  const isDone     = pickup.status === "collected" || pickup.status === "rejected";

  const bagLabel  = pickup.bag
    ? [pickup.bag.size, pickup.bag.gender, pickup.bag.condition].filter(Boolean).join(" · ")
    : "שק תרומה";
  const donorName = pickup.donor || "תורם";

  return (
    <div className={`bg-rw-card rounded-2xl shadow-sm p-4 flex flex-col gap-3
                     ${isDone ? "opacity-60" : ""}`}>

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
          <span className="text-rw-sub text-[10px]">{pickup.date}</span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0
                         ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      </div>

      {/* ימים ושעות שנשלחו למשתמש */}
      {pickup.availableDays?.length > 0 && (
        <div className="bg-rw-bg rounded-xl px-3 py-2 flex flex-col gap-1">
          <p className="text-xs text-rw-sub text-right">
            📅 ימים: {pickup.availableDays.join(", ")}
          </p>
          <p className="text-xs text-rw-sub text-right">
            🕐 שעות: {pickup.availableTimes?.join(", ")}
          </p>
        </div>
      )}

      {/* תיאום שנבחר על ידי המשתמש */}
      {pickup.pickupScheduled && (
        <div className="bg-blue-50 rounded-xl px-3 py-2">
          <p className="text-xs text-blue-600 text-right font-semibold">
            ✓ המשתמש בחר: {pickup.pickupTime}
          </p>
          {pickup.pickupAddress && (
            <p className="text-xs text-blue-500 text-right mt-0.5">
              📍 {pickup.pickupAddress}
            </p>
          )}
        </div>
      )}

      {/* כפתורי פעולה */}
      {!isDone && (
        <div className="flex gap-2">
          <button onClick={() => onCancel(pickup.id)}
            className="border border-red-200 text-red-400 rounded-xl
                       px-3 py-2 text-xs font-semibold active:bg-red-50">
            בטל
          </button>
          {pickup.pickupScheduled && pickup.status !== "collected" && (
            <button onClick={() => onCollect(pickup.id)}
              className="flex-1 bg-rw-btn text-white rounded-xl
                         py-2 text-xs font-semibold active:bg-rw-btn-hover">
              סמן כנאסף ✓
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function OrgPickupsPage() {
  const navigate = useNavigate();
  const { sentDonations, updateSentDonation } = useUser();
  const [activeFilter, setActiveFilter] = useState("all");

  // מציגים רק בקשות שעברו אישור
  const pickups = sentDonations.filter(d =>
    ["approved", "scheduled", "collected"].includes(d.status)
  );

  const visiblePickups = activeFilter === "all"
    ? pickups
    : pickups.filter(p => p.status === activeFilter);

  const pendingCount = pickups.filter(p =>
    p.status === "approved" && !p.pickupScheduled
  ).length;

  const handleCollect = (id) => updateSentDonation(id, { status: "collected" });
  const handleCancel  = (id) => updateSentDonation(id, { status: "rejected"  });

  return (
    <PageContainer className="pb-24 overflow-y-auto" wide>

      <div className="bg-rw-card px-5 pt-6 pb-4 shadow-sm
                      flex items-center justify-between">
        <div className="flex flex-col items-end">
          <h1 className="font-bold text-rw-title text-base">איסופים</h1>
          <p className="text-rw-sub text-xs mt-0.5">
            {pendingCount} ממתינים לתיאום
          </p>
        </div>
        <div onClick={() => navigate("/org/notifications")}
          className="w-10 h-10 bg-rw-input rounded-xl
                     flex items-center justify-center cursor-pointer">
          <span className="text-lg">🔔</span>
        </div>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-4">

        {/* פילטרים */}
        <div className="flex gap-2 overflow-x-auto pb-1 justify-end">
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setActiveFilter(f.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold
                         whitespace-nowrap transition-colors
                         ${activeFilter === f.id
                           ? "bg-rw-btn text-white"
                           : "bg-rw-card text-rw-sub border border-rw-border"}`}>
              {f.label}
            </button>
          ))}
        </div>

        {visiblePickups.length > 0 ? (
          visiblePickups.map(pickup => (
            <PickupCard key={pickup.id} pickup={pickup}
              onCollect={handleCollect}
              onCancel={handleCancel} />
          ))
        ) : (
          <div className="flex flex-col items-center gap-3 pt-16">
            <span className="text-5xl">📭</span>
            <p className="font-bold text-rw-title text-base">אין איסופים להצגה</p>
            <p className="text-rw-sub text-sm text-center">
              אשרי בקשות תרומה כדי שיופיעו כאן.
            </p>
            <button onClick={() => navigate("/org/requests")}
              className="mt-2 bg-rw-btn text-white rounded-xl
                         px-6 py-2.5 text-sm font-semibold">
              לבקשות תרומה
            </button>
          </div>
        )}

      </div>

      <OrgBottomNav active="pickups" />
    </PageContainer>
  );
}
