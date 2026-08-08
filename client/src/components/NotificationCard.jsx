const TYPE_ICON = {
  donation_request:      "📦",
  pickup_update:         "🚗",
  donation_completed:    "✅",
  collaboration_status:  "🤝",
  collaboration_request: "🤲",
  collaboration_active:  "🤝",
  pickup_details:        "📍",
  chat_message:          "💬",
  sorting_pending:       "🧺",
};

function formatTimestamp(ts) {
  return new Date(ts).toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" });
}

// רכיב התראה אחד, רב-שימוש — משותף בין דף ההתראות של עמותה וחנות, כדי
// שלא יהיו שני מימושים נפרדים לאותה כרטיסייה.
export default function NotificationCard({ notification, onClick }) {
  const icon = TYPE_ICON[notification.type] || "🔔";

  return (
    <div
      onClick={() => onClick(notification)}
      className={`rounded-2xl shadow-sm p-4 flex items-start gap-3 cursor-pointer
                  transition-colors active:opacity-80
                  ${notification.isRead ? "bg-rw-card" : "bg-rw-btn/5 border border-rw-btn/20"}`}
    >
      {!notification.isRead && (
        <span className="w-2 h-2 rounded-full bg-rw-btn shrink-0 mt-2" aria-hidden="true" />
      )}
      <div className="w-10 h-10 bg-rw-input rounded-xl flex items-center justify-center shrink-0">
        <span className="text-xl">{icon}</span>
      </div>
      <div className="flex-1 min-w-0 text-right">
        <p className={`text-sm ${notification.isRead ? "font-medium text-rw-sub" : "font-bold text-rw-title"}`}>
          {notification.title}
        </p>
        <p className="text-xs text-rw-sub mt-0.5">{notification.message}</p>
        <p className="text-[10px] text-rw-sub mt-1">{formatTimestamp(notification.timestamp)}</p>
      </div>
    </div>
  );
}
