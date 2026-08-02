// רכיב ניווט תחתון משותף
// נייבא אותו בכל מסך שצריך navbar
// כך לא נכתוב את אותו קוד שוב ושוב

import { useNavigate } from "react-router-dom";
import DesktopSidebar from "./DesktopSidebar";

export default function BottomNav({ active }) {
  // active = איזה כפתור מודגש כרגע
  // למשל: active="home" או active="donate"

  const navigate = useNavigate();

  // הגדרת כפתורי הניווט כמערך
  // כך קל להוסיף/להסיר כפתורים בעתיד
  // אותה רשימה משמשת גם את הבר התחתון (מובייל) וגם את הסיידבר (דסקטופ,
  // ראו DesktopSidebar) — כדי שלא תהיה כפילות בלוגיקת הניווט.
  const items = [
    { id: "home",    icon: "🏠", label: "בית",      path: "/home" },
    { id: "donate",  icon: "➕", label: "תרומה",    path: "/upload" },
    { id: "status",  icon: "🕐", label: "היסטוריה", path: "/status" },
    { id: "profile", icon: "👤", label: "פרופיל",   path: "/profile" },
  ];

  return (
    <>
      {/* מובייל/טאבלט — בר תחתון, כמו היום. מוסתר מ-lg ומעלה. */}
      <nav className="lg:hidden sticky bottom-0 w-full
                      bg-rw-card border-t border-rw-border
                      flex justify-around items-center py-3 px-4 z-50">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className="flex flex-col items-center gap-1"
          >
            <span className="text-xl">{item.icon}</span>
            {/* אם זה הכפתור הפעיל – צבע ירוק, אחרת אפור */}
            <span className={`text-xs font-semibold
              ${active === item.id ? "text-rw-btn" : "text-rw-sub"}`}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      {/* דסקטופ — סיידבר קבוע, אותם items */}
      <DesktopSidebar items={items} active={active} />
    </>
  );
}