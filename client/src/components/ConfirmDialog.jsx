// דיאלוג אישור גנרי ורב-שימוש — מחליף window.confirm() ופעולות הרסניות
// מיידיות בכל האפליקציה. לא יודע כלום על "מה" הוא מאשר — כל ההקשר מגיע
// מה-props (ראו useConfirmDialog.js לשימוש נוח דרך hook יחיד).

import { useEffect, useRef } from "react";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "אישור",
  cancelText = "ביטול",
  destructive = false,
  loading = false,
  disabled = false,
  icon = null,
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const cancelBtnRef = useRef(null);
  const confirmBtnRef = useRef(null);
  const previouslyFocused = useRef(null);

  // פוקוס: נכנסים ל-dialog (על הכפתור הפחות הרסני כברירת מחדל, כדי שלא
  // יהיה קל בטעות ללחוץ Enter ולאשר מחיקה), ומחזירים פוקוס לאלמנט הקודם
  // כשסוגרים — התנהגות נגישה סטנדרטית לדיאלוגים מודאליים.
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement;
    // קוראים ל-focus() ישירות, בלי requestAnimationFrame: ה-ref כבר מחובר
    // בשלב הזה (React מריץ effects אחרי commit), ו-rAF עלול פשוט לא לירות
    // בכלל בטאב לא-פעיל/ברקע — מה שהיה משאיר את הפוקוס מחוץ לדיאלוג.
    const target = destructive ? cancelBtnRef.current : confirmBtnRef.current;
    target?.focus();
    return () => {
      if (previouslyFocused.current instanceof HTMLElement) {
        previouslyFocused.current.focus();
      }
    };
  }, [open, destructive]);

  const handleKeyDown = (e) => {
    if (loading) return; // חסימה מוחלטת בזמן טעינה — כולל Escape, כדי שלא
                          // "ייעלם" דיאלוג בזמן שהפעולה שהוא מייצג עדיין רצה.
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel?.();
      return;
    }
    if (e.key === "Tab") {
      // לכידת פוקוס בסיסית — Tab לא בורח מהדיאלוג החוצה.
      const focusable = dialogRef.current?.querySelectorAll(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/40"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel?.();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={message ? "confirm-dialog-message" : undefined}
        onKeyDown={handleKeyDown}
        className="bg-rw-card rounded-2xl shadow-lg w-full max-w-sm p-6
                   flex flex-col items-center gap-3 outline-none"
      >
        {icon && <span className="text-4xl">{icon}</span>}

        <h2 id="confirm-dialog-title" className="font-bold text-rw-title text-base text-center">
          {title}
        </h2>

        {message && (
          <p id="confirm-dialog-message" className="text-rw-sub text-sm text-center leading-relaxed">
            {message}
          </p>
        )}

        <div className="flex gap-3 w-full mt-3">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 border border-rw-border text-rw-sub rounded-xl py-2.5
                       text-sm font-semibold active:bg-rw-input disabled:opacity-50
                       focus-visible:ring-2 focus-visible:ring-rw-btn focus-visible:ring-offset-1"
          >
            {cancelText}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            disabled={loading || disabled}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white
                       flex items-center justify-center gap-2
                       disabled:opacity-60 disabled:cursor-not-allowed
                       focus-visible:ring-2 focus-visible:ring-offset-1
                       ${destructive
                         ? "bg-red-500 active:bg-red-600 focus-visible:ring-red-400"
                         : "bg-rw-btn active:bg-rw-btn-hover focus-visible:ring-rw-btn"}`}
          >
            {loading && <span className="animate-spin">⏳</span>}
            <span>{loading ? "מעבדת..." : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
