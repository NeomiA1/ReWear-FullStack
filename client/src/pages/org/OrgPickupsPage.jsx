// src/pages/org/OrgPickupsPage.jsx
//
// מסך איסופים – ניהול תרומות שאושרו ועברו לשלב תפעולי.
//
// ─── הסבר לימודי ───────────────────────────────────────────────────────────
//
// מחזור חיי איסוף:
//   "pending"      → ממתין לתיאום (רק אושר, עוד לא תואם)
//   "coordinated"  → תואם (נקבע תאריך ושעה)
//   "collected"    → נאסף (הושלם)
//   "cancelled"    → בוטל
//
// הסטטוסים שמורים ב-useState. כל פעולה קוראת ל-setPickups עם .map()
// ומשנה את status של הפריט הרלוונטי לפי id.
// בעתיד: כל פונקציה תעשה await api.patch(`/pickups/${id}`, { status })
//
// איך הכרטיסים בנויים?
//   PickupCard מקבל את האובייקט המלא + פונקציות callback.
//   הכפתורים מוצגים לפי הסטטוס הנוכחי – לא מציגים כפתורים לא רלוונטיים.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OrgBottomNav from "../../components/OrgBottomNav";

// ─── נתוני דמה ───────────────────────────────────────────────────────────────
const INITIAL_PICKUPS = [
  {
    id: 1,
    donor: "שרה גולן",
    avatar: "ש",
    description: "3 שקיות – בגדי ילדים חורף",
    location: "דיזנגוף 88, תל אביב",
    date: "ראשון 27.4, 10:00–13:00",
    status: "pending",
  },
  {
    id: 2,
    donor: "נועם פרידמן",
    avatar: "נ",
    description: "2 שקיות – נעלים ואקססוריז",
    location: "בן גוריון 5, רמת גן",
    date: "שני 28.4, 14:00–17:00",
    status: "coordinated",
  },
  {
    id: 3,
    donor: "תמר ביטון",
    avatar: "ת",
    description: "1 שקית – מעיל נשים ושמיכה",
    location: "הנביאים 3, ירושלים",
    date: "שלישי 29.4, 09:00–11:00",
    status: "collected",
  },
  {
    id: 4,
    donor: "אלי מזרחי",
    avatar: "א",
    description: "4 שקיות – בגדי גברים מעורב",
    location: "ויצמן 22, חיפה",
    date: "טרם נקבע",
    status: "pending",
  },
];

// ─── צבע ותווית לכל סטטוס ────────────────────────────────────────────────────
const STATUS_DISPLAY = {
  pending:     { label: "ממתין לתיאום", color: "bg-amber-50 text-amber-500"   },
  coordinated: { label: "תואם",         color: "bg-blue-50 text-blue-500"     },
  collected:   { label: "נאסף ✓",       color: "bg-green-50 text-green-600"   },
  cancelled:   { label: "בוטל",         color: "bg-red-50 text-red-400"       },
};

// ─── כרטיס איסוף ─────────────────────────────────────────────────────────────
function PickupCard({ pickup, onCoordinate, onCollect, onCancel }) {
  const statusInfo = STATUS_DISPLAY[pickup.status];
  const isDone = pickup.status === "collected" || pickup.status === "cancelled";

  return (
    <div className={`bg-rw-card rounded-2xl shadow-sm p-4 flex flex-col gap-3
                     ${isDone ? "opacity-60" : ""}`}>

      {/* שורה עליונה: אווטאר + שם + תג סטטוס */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-rw-logo
                        flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">{pickup.avatar}</span>
        </div>
        <div className="flex flex-col items-end flex-1">
          <span className="font-bold text-rw-title text-sm">{pickup.donor}</span>
          <span className="text-rw-sub text-xs">{pickup.description}</span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0
                         ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      </div>

      {/* פרטים: מיקום + תאריך */}
      <div className="bg-rw-bg rounded-xl px-3 py-2 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-rw-sub text-xs">🕐 {pickup.date}</span>
          <span className="text-rw-sub text-xs text-right">📍 {pickup.location}</span>
        </div>
      </div>

      {/* כפתורי פעולה – לפי סטטוס */}
      {!isDone && (
        <div className="flex gap-2">
          {/* בטל – תמיד מוצג כשלא הושלם */}
          <button
            onClick={() => onCancel(pickup.id)}
            className="border border-red-200 text-red-400 rounded-xl
                       px-3 py-2 text-xs font-semibold active:bg-red-50">
            בטל
          </button>

          {pickup.status === "pending" && (
            <button
              onClick={() => onCoordinate(pickup.id)}
              className="flex-1 bg-rw-input text-rw-title rounded-xl
                         py-2 text-xs font-semibold active:opacity-70">
              תיאום איסוף
            </button>
          )}

          {pickup.status === "coordinated" && (
            <button
              onClick={() => onCollect(pickup.id)}
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

// ─── דף איסופים ──────────────────────────────────────────────────────────────
export default function OrgPickupsPage() {
  const navigate = useNavigate();
  const [pickups, setPickups] = useState(INITIAL_PICKUPS);
  const [activeFilter, setActiveFilter] = useState("all");

  // עדכון סטטוס – פונקציה גנרית לשימוש חוזר
  // בעתיד: await api.patch(`/pickups/${id}`, { status })
  const updateStatus = (id, status) => {
    setPickups((prev) =>
      prev.map((p) => p.id === id ? { ...p, status } : p)
    );
  };

  const handleCoordinate = (id) => updateStatus(id, "coordinated");
  const handleCollect    = (id) => updateStatus(id, "collected");
  const handleCancel     = (id) => updateStatus(id, "cancelled");

  // פילטר לפי סטטוס
  const FILTERS = [
    { id: "all",         label: "הכל"    },
    { id: "pending",     label: "ממתים"  },
    { id: "coordinated", label: "תואמים" },
    { id: "collected",   label: "נאספו"  },
  ];

  const visiblePickups = activeFilter === "all"
    ? pickups
    : pickups.filter((p) => p.status === activeFilter);

  const pendingCount = pickups.filter((p) => p.status === "pending").length;

  return (
    <div className="min-h-screen bg-rw-bg pb-24 overflow-y-auto">

      {/* Header */}
      <div className="bg-rw-card px-5 pt-6 pb-4 shadow-sm
                      flex items-center justify-between">
        <div className="flex flex-col items-end">
          <h1 className="font-bold text-rw-title text-base">איסופים</h1>
          <p className="text-rw-sub text-xs mt-0.5">
            {pendingCount} ממתינים לתיאום
          </p>
        </div>
        <div
          onClick={() => navigate("/org/notifications")}
          className="w-10 h-10 bg-rw-input rounded-xl
                     flex items-center justify-center cursor-pointer">
          <span className="text-lg">🔔</span>
        </div>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-4">

        {/* פילטרים */}
        <div className="flex gap-2 overflow-x-auto pb-1 justify-end">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold
                         whitespace-nowrap transition-colors
                         ${activeFilter === f.id
                           ? "bg-rw-btn text-white"
                           : "bg-rw-card text-rw-sub border border-rw-border"}`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* רשימת איסופים */}
        {visiblePickups.length > 0 ? (
          visiblePickups.map((pickup) => (
            <PickupCard
              key={pickup.id}
              pickup={pickup}
              onCoordinate={handleCoordinate}
              onCollect={handleCollect}
              onCancel={handleCancel}
            />
          ))
        ) : (
          <div className="flex flex-col items-center gap-3 pt-16">
            <span className="text-5xl">📭</span>
            <p className="font-bold text-rw-title text-base">אין איסופים להצגה</p>
            <p className="text-rw-sub text-sm text-center">
              אשרי בקשות תרומה כדי שיופיעו כאן.
            </p>
            <button
              onClick={() => navigate("/org/requests")}
              className="mt-2 bg-rw-btn text-white rounded-xl
                         px-6 py-2.5 text-sm font-semibold">
              לבקשות תרומה
            </button>
          </div>
        )}

      </div>

      <OrgBottomNav active="pickups" />
    </div>
  );
}
