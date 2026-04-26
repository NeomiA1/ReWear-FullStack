// רכיב ניווט תחתון משותף
// נייבא אותו בכל מסך שצריך navbar
// כך לא נכתוב את אותו קוד שוב ושוב

import { useNavigate } from "react-router-dom";

export default function BottomNav({ active }) {
  // active = איזה כפתור מודגש כרגע
  // למשל: active="home" או active="donate"

  const navigate = useNavigate();

  // הגדרת כפתורי הניווט כמערך
  // כך קל להוסיף/להסיר כפתורים בעתיד
  const items = [
    { id: "home",    icon: "🏠", label: "בית",      path: "/home" },
    { id: "donate",  icon: "➕", label: "תרומה",    path: "/upload" },
    { id: "history", icon: "🕐", label: "היסטוריה", path: "/history" },
    { id: "profile", icon: "👤", label: "פרופיל",   path: "/profile" },
  ];

  return (
    // fixed bottom-0 = קבוע בתחתית תמיד
    // left-1/2 -translate-x-1/2 = ממרכז אופקית
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2
                    w-full max -w-[390px]
                    bg-rw-card border-t border-rw-border
                    flex justify-around items-center py-3 px-4">

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
  );
}