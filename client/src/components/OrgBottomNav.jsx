// src/components/OrgBottomNav.jsx
// הוספנו "שיתופים" עם גישה לצ'אט עם חנויות

import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

const NAV_ITEMS = [
  { id: "home",          icon: "🏠", label: "בית",      path: "/org/home"     },
  { id: "requests",      icon: "📋", label: "בקשות",    path: "/org/requests" },
  { id: "pickups",       icon: "🚗", label: "איסופים",  path: "/org/pickups"  },
  { id: "collaborations",icon: "🤝", label: "שיתופים",  path: "/org/collaborations" },
  { id: "profile",       icon: "👤", label: "פרופיל",   path: "/org/profile"  },
];

export default function OrgBottomNav({ active }) {
  const navigate = useNavigate();
  const { collaborations } = useUser();

  // מספר שיתופים פעילים לתג
  const activeCollabs = (collaborations || []).filter(c => c.status === "approved").length;

  return (
    <nav className="sticky bottom-0 w-full bg-rw-card border-t border-rw-border
                    flex justify-around items-center py-3 px-4 z-50">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          onClick={() => navigate(item.path)}
          className="flex flex-col items-center gap-1 relative">

          {/* תג על שיתופים */}
          {item.id === "collaborations" && activeCollabs > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500
                             text-white text-[9px] font-bold rounded-full
                             flex items-center justify-center">
              {activeCollabs}
            </span>
          )}

          <span className="text-xl">{item.icon}</span>
          <span className={`text-xs font-semibold
            ${active === item.id ? "text-rw-btn" : "text-rw-sub"}`}>
            {item.label}
          </span>
        </button>
      ))}
    </nav>
  );
}
