// סיידבר ניווט משותף לדסקטופ (lg ומעלה) — גרסה חלופית לניווט התחתון
// במסכים גדולים, לא תחליף לו במובייל. מקבל את *אותה* רשימת items (עם
// {id, icon, label, path}) שכל BottomNav-משפחה כבר מגדירה לבר התחתון שלה
// — אותו נתון בדיוק, כדי שלא תהיה שום כפילות בלוגיקת הניווט. ראו
// BottomNav.jsx / OrgBottomNav.jsx / ShopBottomNav.jsx, שכל אחד מהם מרנדר
// את הבר התחתון שלו (מוסתר ב-lg) ואת הסיידבר הזה (מוסתר מתחת ל-lg).
import { useNavigate } from "react-router-dom";

export default function DesktopSidebar({ items, active, title, badgeCounts = {} }) {
  const navigate = useNavigate();
  return (
    <nav className="hidden lg:flex lg:flex-col lg:fixed lg:right-0 lg:top-0
                    lg:h-screen lg:w-56 xl:w-64 bg-rw-card border-l border-rw-border
                    px-4 py-6 gap-1 z-40">
      <div className="flex items-center gap-2 px-2 mb-6">
        <div className="w-9 h-9 rounded-xl bg-rw-logo flex items-center justify-center shrink-0">
          <span className="text-white text-base font-bold">R</span>
        </div>
        <span className="font-bold text-rw-title text-base">{title || "ReWear"}</span>
      </div>

      {items.map((item) => {
        const badge = badgeCounts[item.id];
        return (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold
                       text-right transition-colors relative
                       ${active === item.id
                         ? "bg-rw-btn/10 text-rw-btn"
                         : "text-rw-sub hover:bg-rw-input"}`}
          >
            {badge > 0 && (
              <span className="mr-auto w-4 h-4 bg-green-500 text-white text-[9px]
                               font-bold rounded-full flex items-center justify-center">
                {badge}
              </span>
            )}
            <span className="flex-1 text-right">{item.label}</span>
            <span className="text-lg">{item.icon}</span>
          </button>
        );
      })}
    </nav>
  );
}
