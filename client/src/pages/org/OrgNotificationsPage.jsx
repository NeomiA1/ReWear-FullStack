import { useState } from "react";
import { useNavigate } from "react-router-dom";

// ─── נתונים לדוגמה ───────────────────────────────────────
// בשלב הבא יגיעו מהשרת
const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    donor: "הילה כהן",
    avatar: "ה",
    bagDesc: "שק 1 · M · בנות · חדש",
    date: "20.4.2026",
    time: "14:30",
    status: "pending",      // ממתין לאישור
    pickupTime: null,
    pickupAddress: null,
  },
  {
    id: 2,
    donor: "יוסי אברהם",
    avatar: "י",
    bagDesc: "שק 2 · L · גברים · תקין",
    date: "20.4.2026",
    time: "11:00",
    status: "pending",
    pickupTime: null,
    pickupAddress: null,
  },
  {
    id: 3,
    donor: "דנה לוי",
    avatar: "ד",
    bagDesc: "שק 1 · S · נשים · כמו חדש",
    date: "19.4.2026",
    time: "09:15",
    status: "scheduled",    // תואם איסוף
    pickupTime: "10:00 – 12:00",
    pickupAddress: "רחוב הרצל 5, תל אביב",
  },
  {
    id: 4,
    donor: "משה ישראל",
    avatar: "מ",
    bagDesc: "שק 3 · XL · גברים · משומש",
    date: "18.4.2026",
    time: "16:45",
    status: "approved",     // אושר
    pickupTime: "14:00 – 16:00",
    pickupAddress: "שדרות בן גוריון 12, חיפה",
  },
];

// ─── הגדרת סטטוסים ────────────────────────────────────────
// לכל סטטוס יש תווית, צבע רקע וצבע טקסט
const STATUS_CONFIG = {
  pending: {
    label: "ממתין לאישור",
    bg: "bg-yellow-50",
    text: "text-yellow-600",
    dot: "bg-yellow-400",
  },
  scheduled: {
    label: "תואם איסוף",
    bg: "bg-blue-50",
    text: "text-blue-600",
    dot: "bg-blue-400",
  },
  approved: {
    label: "אושר",
    bg: "bg-green-50",
    text: "text-green-600",
    dot: "bg-green-400",
  },
};

// ─── רכיב כרטיס התראה ────────────────────────────────────
function NotificationCard({ notification, onOpen, onApprove }) {

  const status = STATUS_CONFIG[notification.status];

  return (
    <div className="bg-rw-card rounded-2xl shadow-sm p-4 flex flex-col gap-3">

      {/* ── שורה עליונה: אווטאר + שם + תאריך ── */}
      <div className="flex items-center justify-between">

        {/* תאריך + שעה – שמאל */}
        <div className="flex flex-col items-start">
          <span className="text-xs text-rw-sub">{notification.date}</span>
          <span className="text-xs text-rw-sub">{notification.time}</span>
        </div>

        {/* שם + אווטאר – ימין */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="font-semibold text-rw-title text-sm">
              {notification.donor}
            </span>
            <span className="text-xs text-rw-sub mt-0.5">
              {notification.bagDesc}
            </span>
          </div>
          {/* עיגול עם האות הראשונה */}
          <div className="w-10 h-10 rounded-full bg-rw-logo
                          flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {notification.avatar}
            </span>
          </div>
        </div>

      </div>

      {/* ── פרטי תיאום (אם קיימים) ── */}
      {notification.pickupTime && (
        <div className="bg-rw-input rounded-xl px-3 py-2 flex flex-col gap-1">
          <div className="flex justify-between">
            <span className="text-xs text-rw-sub">{notification.pickupTime}</span>
            <span className="text-xs font-medium text-rw-title">⏰ שעת איסוף</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-rw-sub">{notification.pickupAddress}</span>
            <span className="text-xs font-medium text-rw-title">📍 כתובת</span>
          </div>
        </div>
      )}

      {/* ── שורה תחתונה: סטטוס + כפתורים ── */}
      <div className="flex items-center justify-between">

        {/* כפתורים – שמאל */}
        <div className="flex gap-2">
          {/* כפתור פתח – תמיד מוצג */}
          <button
            onClick={() => onOpen(notification)}
            className="border border-rw-border text-rw-sub rounded-xl
                       px-3 py-1.5 text-xs active:bg-rw-input"
          >
            פתח
          </button>

          {/* כפתור אשר – רק אם ממתין */}
          {notification.status === "pending" && (
            <button
              onClick={() => onApprove(notification)}
              className="bg-rw-btn text-white rounded-xl
                         px-3 py-1.5 text-xs active:bg-rw-btn-hover"
            >
              אשר
            </button>
          )}
        </div>

        {/* סטטוס – ימין */}
        {/* badge עם צבע לפי הסטטוס */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full
                         ${status.bg}`}>
          {/* נקודה צבעונית */}
          <div className={`w-2 h-2 rounded-full ${status.dot}`}></div>
          <span className={`text-xs font-medium ${status.text}`}>
            {status.label}
          </span>
        </div>

      </div>
    </div>
  );
}

// ─── הקומפוננטה הראשית ────────────────────────────────────
export default function OrgNotificationsPage() {

  const navigate = useNavigate();

  // state של ההתראות – בשלב הבא יגיע מ-Context או שרת
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  // ─── אישור בקשה ──────────────────────────────────────
  const handleApprove = (notification) => {
    // מעדכנים את הסטטוס ל-"approved"
    setNotifications(prev =>
      prev.map(n =>
        n.id === notification.id
          ? { ...n, status: "approved" }
          : n
      )
    );
    alert(`אישרת את בקשת ${notification.donor} ✅`);
  };

  // ─── פתיחת בקשה ──────────────────────────────────────
  const handleOpen = (notification) => {
    alert(`פרטי בקשה של ${notification.donor}:\n${notification.bagDesc}`);
    // בשלב הבא: navigate(`/org/request/${notification.id}`)
  };

  // ─── חלוקה לפי סטטוס ─────────────────────────────────
  // filter = מסנן רק את ההתראות עם הסטטוס הרלוונטי
  const pending   = notifications.filter(n => n.status === "pending");
  const scheduled = notifications.filter(n => n.status === "scheduled");
  const approved  = notifications.filter(n => n.status === "approved");

  return (
    <div className="min-h-screen bg-rw-bg pb-10 overflow-y-auto">

      {/* ── כותרת ── */}
      <div className="sticky top-0 bg-rw-bg z-10
                      flex items-center justify-between
                      px-5 py-4 border-b border-rw-border">
        <button
          onClick={() => navigate("/org/home")}
          className="text-rw-sub text-2xl"
        >
          →
        </button>
        <h1 className="font-bold text-rw-title text-base">התראות</h1>
        {/* badge עם מספר ממתינים */}
        <div className="bg-yellow-400 text-white text-xs font-bold
                        w-6 h-6 rounded-full flex items-center justify-center">
          {pending.length}
        </div>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-6">

        {/* ── סקשן: ממתינים לאישור ── */}
        {pending.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="bg-yellow-50 text-yellow-600 text-xs
                               px-2 py-1 rounded-full font-medium">
                {pending.length}
              </span>
              <h2 className="font-bold text-rw-title text-sm">
                ממתינים לאישור
              </h2>
            </div>
            <div className="flex flex-col gap-3">
              {pending.map(n => (
                <NotificationCard
                  key={n.id}
                  notification={n}
                  onOpen={handleOpen}
                  onApprove={handleApprove}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── סקשן: תואם איסוף ── */}
        {scheduled.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="bg-blue-50 text-blue-600 text-xs
                               px-2 py-1 rounded-full font-medium">
                {scheduled.length}
              </span>
              <h2 className="font-bold text-rw-title text-sm">
                תואם איסוף
              </h2>
            </div>
            <div className="flex flex-col gap-3">
              {scheduled.map(n => (
                <NotificationCard
                  key={n.id}
                  notification={n}
                  onOpen={handleOpen}
                  onApprove={handleApprove}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── סקשן: אושרו ── */}
        {approved.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="bg-green-50 text-green-600 text-xs
                               px-2 py-1 rounded-full font-medium">
                {approved.length}
              </span>
              <h2 className="font-bold text-rw-title text-sm">
                אושרו
              </h2>
            </div>
            <div className="flex flex-col gap-3">
              {approved.map(n => (
                <NotificationCard
                  key={n.id}
                  notification={n}
                  onOpen={handleOpen}
                  onApprove={handleApprove}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── אין התראות ── */}
        {notifications.length === 0 && (
          <div className="bg-rw-card rounded-2xl p-8 text-center shadow-sm">
            <p className="text-3xl mb-2">🔔</p>
            <p className="text-rw-sub text-sm">אין התראות חדשות</p>
          </div>
        )}

      </div>
    </div>
  );
}