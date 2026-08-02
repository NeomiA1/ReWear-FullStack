// מעטפת משותפת למסכי אימות (התחברות/הרשמה/onboarding) — צורה שונה
// במהותה מ-PageContainer: כרטיס אחד ממורכז, בלי ניווט תחתון. במסכים
// גדולים מוסיפה פאנל מיתוג ירוק לצד הכרטיס (רשות, כברירת מחדל דולק),
// בלי לגעת בתוכן הפנימי של כל עמוד — הלוגו/כותרת/טופס נשארים בעמוד עצמו.
//
// wide — לטפסים ארוכים יותר (הרשמת עמותה/חנות, בחירת נושאים ברשת) שנראים
// דחוסים ב-max-w-sm הרגיל בדסקטופ. לא משפיע על מובייל בכלל.
export default function AuthLayout({ children, showBranding = true, wide = false }) {
  const outerMax = wide ? "lg:max-w-6xl" : "lg:max-w-4xl";
  const innerMax = wide ? "max-w-xl" : "max-w-sm";

  return (
    <div className="min-h-screen bg-rw-bg flex items-center justify-center">
      <div className={`w-full ${outerMax} lg:grid lg:grid-cols-2 lg:bg-rw-card
                      lg:rounded-3xl lg:shadow-lg lg:overflow-hidden lg:my-10`}>

        {/* פאנל מיתוג — רק במסכים גדולים */}
        {showBranding && (
          <div className="hidden lg:flex flex-col items-center justify-center
                          bg-rw-btn text-white p-12 gap-4 order-2">
            <div className="w-20 h-20 rounded-2xl bg-white/15 flex items-center justify-center">
              <span className="text-4xl font-bold">R</span>
            </div>
            <h2 className="text-2xl font-bold">ReWear</h2>
            <p className="text-sm text-white/85 text-center leading-relaxed max-w-xs">
              נותנים לבגדים חיים שנייה — מחברים תורמים, עמותות וחנויות יד שנייה במקום אחד.
            </p>
          </div>
        )}

        {/* תוכן העמוד עצמו — לוגו/כותרת/טופס, ללא שינוי */}
        <div className={`w-full min-h-screen lg:min-h-0 px-6 py-8 lg:p-10
                        overflow-y-auto order-1 flex flex-col justify-center
                        ${!showBranding ? "lg:col-span-2" : ""}`}>
          <div className={`w-full ${innerMax} mx-auto`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
