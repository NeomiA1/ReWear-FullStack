import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";

const KPI_DATA = [
  { id: 1, label: "ציון אימפקט",    value: "98",    change: "+6% החודש",  positive: true, icon: "🌿" },
  { id: 2, label: "פריטים שהתקבלו", value: "1,240", change: "+12% השבוע", positive: true, icon: "📦" },
];

const URGENT_NEEDS = [
  { id: 1, title: "מעילים ובגדי חורף", description: "חסר ברשימת עבור נשים בסיכון (S-L)", icon: "🧥" },
];

// ─── נתונים קבועים לחנויות יד שנייה ─────────────────────────────────────────
// בעתיד: יוחלפו ב-API call: await api.get('/stores/available')
const AVAILABLE_STORES = [
  { id: 1, name: "חנות חמד",      city: "חיפה",    items: "בגדים ונעליים"         },
  { id: 2, name: "יד שנייה בטוב", city: "תל אביב", items: "ציוד תינוקות"          },
  { id: 3, name: "מסע בזמן",      city: "ירושלים", items: "בגדים, ספרים, כלי בית" },
  { id: 4, name: "החנות הירוקה",  city: "נתניה",   items: "בגדי ילדים"            },
];

function OrgBottomNav({ active }) {
  const navigate = useNavigate();
  const items = [
    { id: "home",     icon: "🏠", label: "בית",    path: "/org/home" },
    { id: "requests", icon: "📋", label: "בקשות",  path: "/org/requests" },
    { id: "messages", icon: "💬", label: "הודעות", path: "/org/messages" },
    { id: "profile",  icon: "👤", label: "פרופיל", path: "/org/profile" },
  ];
  return (
    <nav className="sticky bottom-0 w-full bg-rw-card border-t border-rw-border
                    flex justify-around items-center py-3 px-4 z-50">
      {items.map((item) => (
        <button key={item.id} onClick={() => navigate(item.path)}
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

export default function OrgHomePage() {

  const navigate = useNavigate();
  const { user } = useUser();

  // ─── State: החנות הנבחרה לשיתוף פעולה ───────────────────────────────────
  // null  → לא נבחרה עדיין, מציגים את הרשימה
  // {...} → חנות נבחרה, מציגים כרטיס אישור
  //
  // לחיצה על "בחרי לשיתוף פעולה" → setSelectedStore(store)
  // לחיצה על "החלף חנות"          → setSelectedStore(null)
  //
  // בעתיד לחבר לשרת – רק שני שינויים:
  //   שמירה:  await api.post('/org/selected-store', { storeId: store.id })
  //   טעינה:  useEffect(() => { api.get('/org/selected-store').then(res => setSelectedStore(res.data)) }, [])
  const [selectedStore, setSelectedStore] = useState(null);
  const [searchQuery, setSearchQuery] = useState(""); // חיפוש חנות לפי שם / עיר / סוג פריטים

  useEffect(() => {
    const saved = localStorage.getItem("rewear_user");
    if (!saved) {
      navigate("/");
    }
  }, []);

  const savedUser = JSON.parse(localStorage.getItem("rewear_user") || "{}");
  const orgName = user?.orgName || savedUser?.orgName || 'עמותת "לב חם"';

  return (
    <div className="min-h-screen bg-rw-bg pb-24 overflow-y-auto">

      {/* Header – ללא שינוי */}
      <div className="bg-rw-card px-5 pt-6 pb-4 shadow-sm
                      flex items-center justify-between">
        <div className="flex flex-col items-end">
          <h1 className="font-bold text-rw-title text-base">
            {orgName}
          </h1>
          <p className="text-rw-sub text-xs mt-0.5">סיוע לנשים במצבי סיכון</p>
        </div>
        <div className="relative">
         <div
            onClick={() => navigate("/org/notifications")}
            className="w-10 h-10 bg-rw-input rounded-xl
                       flex items-center justify-center cursor-pointer">
            <span className="text-lg">🔔</span>
          </div>
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-400
                        rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">3</span>
        </div>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-6">

        {/* לוח בקרה – ללא שינוי */}
        <div>
          <h2 className="font-bold text-rw-title text-base mb-3">לוח בקרה</h2>
          <div className="grid grid-cols-2 gap-4">
            {KPI_DATA.map((kpi) => (
              <div key={kpi.id}
                className="bg-rw-card rounded-2xl p-4 shadow-sm flex flex-col items-end gap-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-rw-sub">{kpi.label}</span>
                  <span className="text-xl">{kpi.icon}</span>
                </div>
                <span className="text-2xl font-bold text-rw-title">{kpi.value}</span>
                <span className={`text-xs font-medium
                  ${kpi.positive ? "text-green-500" : "text-red-400"}`}>
                  {kpi.change}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* צרכים דחופים – ללא שינוי */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-rw-green text-sm cursor-pointer">✏️ עריכה</span>
            <h2 className="font-bold text-rw-title text-base">צרכים דחופים</h2>
          </div>
          <div className="flex flex-col gap-3">
            {URGENT_NEEDS.map((need) => (
              <div key={need.id}
                className="bg-rw-card rounded-2xl shadow-sm p-4
                           flex items-center justify-between">
                <div className="flex flex-col items-end gap-1">
                  <span className="font-semibold text-rw-title text-sm">{need.title}</span>
                  <span className="text-rw-sub text-xs">{need.description}</span>
                </div>
                <div className="w-10 h-10 bg-rw-input rounded-xl
                                flex items-center justify-center">
                  <span className="text-xl">{need.icon}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            ✅ חדש: שיתוף פעולה עם חנות יד שנייה
            מיקום: אחרי "צרכים דחופים" – לפני "תרומות ממתינות"
        ══════════════════════════════════════════════════════════════ */}
        <div>

          {/* כותרת – כולל כפתור "החלף חנות" אם נבחרה */}
          <div className="flex items-center justify-between mb-3">
            {selectedStore ? (
              <button
                onClick={() => setSelectedStore(null)}
                className="text-rw-green text-sm font-semibold">
                החלף חנות
              </button>
            ) : (
              <span /> // placeholder לשמור על justify-between
            )}
            <h2 className="font-bold text-rw-title text-base">
              שיתוף פעולה עם חנות יד שנייה
            </h2>
          </div>

          {selectedStore ? (
            // מצב א׳: חנות נבחרה → כרטיס אישור
            <div className="bg-rw-card rounded-2xl shadow-sm p-4
                            flex items-center justify-between
                            border border-rw-green/40">
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs text-rw-sub mb-0.5">
                  החנות שנבחרה לשיתוף פעולה
                </span>
                <span className="font-bold text-rw-title text-sm">
                  {selectedStore.name}
                </span>
                <span className="text-rw-sub text-xs">{selectedStore.city}</span>
                <span className="text-rw-green text-xs font-medium">
                  {selectedStore.items}
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 bg-rw-green/10 rounded-xl
                                flex items-center justify-center">
                  <span className="text-2xl">🤝</span>
                </div>
                <span className="text-rw-green text-[10px] font-bold">פעיל</span>
              </div>
            </div>

          ) : (
            // מצב ב׳: לא נבחרה → שדה חיפוש + רשימת חנויות
            <div className="flex flex-col gap-3">

              {/* שדה חיפוש */}
              <div className="bg-rw-card rounded-2xl shadow-sm px-4 py-2
                              flex items-center gap-2 border border-rw-border">
                <span className="text-rw-sub text-base">🔍</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="חיפוש לפי שם, עיר או סוג פריטים..."
                  className="flex-1 bg-transparent text-sm text-rw-title
                             placeholder:text-rw-sub outline-none text-right"
                  dir="rtl"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-rw-sub text-lg leading-none">
                    ✕
                  </button>
                )}
              </div>

              {/* תוצאות חיפוש */}
              {AVAILABLE_STORES
                .filter((store) => {
                  const q = searchQuery.trim().toLowerCase();
                  if (!q) return true;
                  return (
                    store.name.toLowerCase().includes(q) ||
                    store.city.toLowerCase().includes(q) ||
                    store.items.toLowerCase().includes(q)
                  );
                })
                .map((store) => (
                <div key={store.id}
                  className="bg-rw-card rounded-2xl shadow-sm p-4
                             flex items-center justify-between">
                  {/* כפתור בחירה */}
                  <button
                    onClick={() => setSelectedStore(store)}
                    className="bg-rw-btn text-white rounded-xl px-3 py-2
                               text-xs font-semibold active:bg-rw-btn-hover
                               whitespace-nowrap shrink-0">
                    בחרי לשיתוף פעולה
                  </button>
                  {/* פרטי החנות */}
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="font-semibold text-rw-title text-sm">
                        {store.name}
                      </span>
                      <span className="text-rw-sub text-xs">{store.city}</span>
                      <span className="text-rw-green text-xs font-medium">
                        {store.items}
                      </span>
                    </div>
                    <div className="w-10 h-10 bg-rw-input rounded-xl
                                    flex items-center justify-center shrink-0">
                      <span className="text-xl">🏪</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* הודעה אם אין תוצאות */}
              {AVAILABLE_STORES.filter((store) => {
                const q = searchQuery.trim().toLowerCase();
                if (!q) return true;
                return (
                  store.name.toLowerCase().includes(q) ||
                  store.city.toLowerCase().includes(q) ||
                  store.items.toLowerCase().includes(q)
                );
              }).length === 0 && (
                <div className="bg-rw-card rounded-2xl shadow-sm p-6
                                flex flex-col items-center gap-2">
                  <span className="text-3xl">🔍</span>
                  <p className="text-rw-sub text-sm text-center">
                    לא נמצאו חנויות עבור &ldquo;{searchQuery}&rdquo;
                  </p>
                </div>
              )}

            </div>
          )}

        </div>
        {/* ══════════════════════════════════════════════════════════════ */}

      </div>

      <OrgBottomNav active="home" />
    </div>
  );
}

