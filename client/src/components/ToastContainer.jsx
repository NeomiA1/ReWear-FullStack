import Toast from "./Toast";

// ממוקם למעלה במרכז — כדי לא להתנגש עם ה-BottomNav הקבוע בתחתית המסך בכל
// הדפים המחוברים. pointer-events-none על המעטפת כדי שהאזור השקוף סביב
// הטוסטים לא יחסום קליקים, ו-pointer-events-auto רק על כל טוסט בפועל.
export default function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="התראות מערכת"
      className="fixed top-4 inset-x-0 z-[100] flex flex-col items-center gap-2
                 px-4 pointer-events-none"
    >
      {toasts.map((t) => (
        <div key={t.id} className="w-full max-w-sm pointer-events-auto">
          <Toast
            type={t.type}
            message={t.message}
            description={t.description}
            onClose={() => onDismiss(t.id)}
          />
        </div>
      ))}
    </div>
  );
}
