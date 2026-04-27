// src/pages/org/OrgRequestsPage.jsx
//
// מסך בקשות – מציג בקשות תרומה חדשות ממשתמשים.
//
// ─── הסבר לימודי ───────────────────────────────────────────────────────────
//
// מה ההבדל בין בקשות לאיסופים?
//   בקשות  = שלב 1: משתמש שלח בקשה לתרום. העמותה עדיין לא אישרה.
//   איסופים = שלב 2: העמותה אישרה את הבקשה, עכשיו צריך לתאם איסוף פיזי.
//
// איך עובד state הסטטוסים?
//   INITIAL_REQUESTS מכיל מערך של בקשות עם status: "new".
//   כשמאשרים → status משתנה ל-"approved" (ונעלם מהרשימה).
//   כשדוחים   → status משתנה ל-"rejected" (ונעלם מהרשימה).
//   זה מדמה עבודה עם שרת – בעתיד פשוט מחליפים ב-API call.
//
// איך הכרטיסים בנויים?
//   כל כרטיס מקבל את ה-id של הבקשה ומפעיל handleApprove/handleReject.
//   הפונקציות משתמשות ב-setRequests עם .map() – לא מוחקות,
//   אלא משנות את status כדי שנוכל בעתיד לראות היסטוריה.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OrgBottomNav from "../../components/OrgBottomNav";

// ─── נתוני דמה ───────────────────────────────────────────────────────────────
const INITIAL_REQUESTS = [
  {
    id: 1,
    donor: "מיכל לוי",
    avatar: "מ",
    description: "בגדי ילדים – חורף",
    location: "רחוב הרצל 12, תל אביב",
    bags: 3,
    status: "new",
  },
  {
    id: 2,
    donor: "אבי כהן",
    avatar: "א",
    description: "שמיכות ומצעים",
    location: "שכונת הדר, חיפה",
    bags: 2,
    status: "new",
  },
  {
    id: 3,
    donor: "רונית שמש",
    avatar: "ר",
    description: "נעלי נשים ותיקים",
    location: "נס ציונה מרכז",
    bags: 1,
    status: "new",
  },
  {
    id: 4,
    donor: "דוד ברקוביץ",
    avatar: "ד",
    description: "מעילים לגברים",
    location: "ירושלים – קריית יובל",
    bags: 4,
    status: "new",
  },
];

// ─── כרטיס בקשה ──────────────────────────────────────────────────────────────
function RequestCard({ req, onApprove, onReject }) {
  return (
    <div className="bg-rw-card rounded-2xl shadow-sm p-4 flex flex-col gap-3">

      {/* שורה עליונה: אווטאר + שם + תיאור */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-rw-logo
                        flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">{req.avatar}</span>
        </div>
        <div className="flex flex-col items-end flex-1">
          <span className="font-bold text-rw-title text-sm">{req.donor}</span>
          <span className="text-rw-sub text-xs">{req.description}</span>
        </div>
        {/* תג סטטוס */}
        <span className="bg-blue-50 text-blue-500 text-[10px] font-bold
                         px-2 py-0.5 rounded-full shrink-0">
          בקשה חדשה
        </span>
      </div>

      {/* פרטים: מיקום + שקיות */}
      <div className="flex items-center justify-between
                      bg-rw-bg rounded-xl px-3 py-2">
        <span className="text-rw-sub text-xs">
          🛍️ {req.bags} {req.bags === 1 ? "שקית" : "שקיות"}
        </span>
        <span className="text-rw-sub text-xs text-right">📍 {req.location}</span>
      </div>

      {/* כפתורי פעולה */}
      <div className="flex gap-2">
        <button
          onClick={() => onReject(req.id)}
          className="flex-1 border border-red-200 text-red-400 rounded-xl
                     py-2 text-xs font-semibold active:bg-red-50">
          דחה
        </button>
        <button
          onClick={() => onApprove(req.id)}
          className="flex-1 bg-rw-btn text-white rounded-xl
                     py-2 text-xs font-semibold active:bg-rw-btn-hover">
          אשר בקשה
        </button>
      </div>

    </div>
  );
}

// ─── דף בקשות ────────────────────────────────────────────────────────────────
export default function OrgRequestsPage() {
  const navigate = useNavigate();

  // State: מערך הבקשות. כל פעולה משנה את status, לא מוחקת.
  const [requests, setRequests] = useState(INITIAL_REQUESTS);

  // מאשרים בקשה → status = "approved" → נעלמת מהרשימה הפעילה
  // בעתיד: await api.post(`/requests/${id}/approve`)
  const handleApprove = (id) => {
    setRequests((prev) =>
      prev.map((r) => r.id === id ? { ...r, status: "approved" } : r)
    );
  };

  // דוחים בקשה → status = "rejected"
  // בעתיד: await api.post(`/requests/${id}/reject`)
  const handleReject = (id) => {
    setRequests((prev) =>
      prev.map((r) => r.id === id ? { ...r, status: "rejected" } : r)
    );
  };

  // מציגים רק בקשות פעילות (לא אושרו ולא נדחו)
  const activeRequests = requests.filter((r) => r.status === "new");
  const approvedCount  = requests.filter((r) => r.status === "approved").length;

  return (
    <div className="min-h-screen bg-rw-bg pb-24 overflow-y-auto">

      {/* Header */}
      <div className="bg-rw-card px-5 pt-6 pb-4 shadow-sm
                      flex items-center justify-between">
        <div className="flex flex-col items-end">
          <h1 className="font-bold text-rw-title text-base">בקשות תרומה</h1>
          <p className="text-rw-sub text-xs mt-0.5">
            {activeRequests.length} בקשות ממתינות לאישור
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

        {/* כמה אושרו עד עכשיו */}
        {approvedCount > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-2xl
                          px-4 py-3 flex items-center justify-between">
            <span className="text-green-600 text-xs font-semibold">
              עברו לאיסופים →
            </span>
            <span className="text-green-700 text-sm font-bold">
              ✅ {approvedCount} בקשות אושרו
            </span>
          </div>
        )}

        {/* רשימת בקשות */}
        {activeRequests.length > 0 ? (
          activeRequests.map((req) => (
            <RequestCard
              key={req.id}
              req={req}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))
        ) : (
          // מצב ריק
          <div className="flex flex-col items-center gap-3 pt-16">
            <span className="text-5xl">🎉</span>
            <p className="font-bold text-rw-title text-base">אין בקשות ממתינות</p>
            <p className="text-rw-sub text-sm text-center">
              כל הבקשות טופלו. עברי למסך האיסופים לניהול המשך.
            </p>
            <button
              onClick={() => navigate("/org/pickups")}
              className="mt-2 bg-rw-btn text-white rounded-xl
                         px-6 py-2.5 text-sm font-semibold">
              למסך האיסופים
            </button>
          </div>
        )}

      </div>

      <OrgBottomNav active="requests" />
    </div>
  );
}
