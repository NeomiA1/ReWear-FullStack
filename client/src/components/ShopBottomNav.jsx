import { useNavigate } from "react-router-dom";

const NAV_ITEMS = [
  { id: "home",        icon: "🏠", label: "בית",      path: "/shop/home"        },
  { id: "inventory",   icon: "📦", label: "מלאי",     path: "/shop/inventory"   },
  { id: "partners",    icon: "🤝", label: "שיתופים",  path: "/shop/partners"    },
  { id: "profile",     icon: "👤", label: "פרופיל",   path: "/shop/profile"     },
];

export default function ShopBottomNav({ active }) {
  const navigate = useNavigate();
  return (
    <nav className="sticky bottom-0 w-full bg-rw-card border-t border-rw-border
                    flex justify-around items-center py-3 px-4 z-50">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          onClick={() => navigate(item.path)}
          className="flex flex-col items-center gap-1">
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