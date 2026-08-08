const TYPE_STYLES = {
  success: { icon: "✅", bg: "bg-green-50", border: "border-green-200", text: "text-green-700", sub: "text-green-600" },
  error:   { icon: "❌", bg: "bg-red-50",   border: "border-red-200",   text: "text-red-700",   sub: "text-red-600"   },
  warning: { icon: "⚠️", bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700",  sub: "text-amber-600"  },
  info:    { icon: "ℹ️", bg: "bg-blue-50",  border: "border-blue-200",  text: "text-blue-700",   sub: "text-blue-600"   },
};

export default function Toast({ type, message, description, onClose }) {
  const style = TYPE_STYLES[type] || TYPE_STYLES.info;
  // שגיאות/אזהרות מוכרזות מיידית ("assertive") לקוראי מסך; הצלחה/מידע
  // מוכרזות בעדינות ("polite") כדי לא להפריע לפעולה שהמשתמשת באמצע.
  const isUrgent = type === "error" || type === "warning";

  return (
    <div
      role={isUrgent ? "alert" : "status"}
      aria-live={isUrgent ? "assertive" : "polite"}
      aria-atomic="true"
      className={`${style.bg} ${style.border} border rounded-2xl shadow-lg
                  px-4 py-3 flex items-start gap-3 w-full`}
    >
      <span className="text-lg shrink-0 mt-0.5" aria-hidden="true">{style.icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${style.text}`}>{message}</p>
        {description && (
          <p className={`text-xs mt-0.5 ${style.sub}`}>{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="סגירת התראה"
        className={`shrink-0 text-lg leading-none ${style.sub} opacity-70 active:opacity-100`}
      >
        ✕
      </button>
    </div>
  );
}
