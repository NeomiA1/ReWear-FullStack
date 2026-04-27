// src/pages/shop/ShopHomePage.jsx
//
// מסך הבית של חנות יד שנייה באפליקציית ReWear.
//
// ─── מבנה המסך (סקשנים) ───────────────────────────────────────────────────
//  1. Header       – שם החנות + פעמון
//  2. KPI Cards    – מדדים: מלאי / עמותות / נמכרו
//  3. Partners     – עמותות שותפות
//  4. New Items    – פריטים חדשים שהתקבלו
//  5. ShopBottomNav – סרגל ניווט תחתון
// ──────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ShopBottomNav from "../../components/ShopBottomNav";

// ─── נתוני דמה ───────────────────────────────────────────────────────────────

// מדדים – כרטיסי KPI
// כל אובייקט מכיל: label, value, icon
// בעתיד: יגיעו מ-api.get('/shop/stats')
const KPI_DATA = [
  { id: 1, label: "פריטים במלאי",   value: "128", icon: "👗" },
  { id: 2, label: "עמותות שותפות",  value: "4",   icon: "🤝" },
  { id: 3, label: "פריטים שנמכרו",  value: "37",  icon: "✅" },
];

// עמותות שותפות
// status: "active" = שיתוף פעיל | "pending" = ממתין לאישור
const PARTNER_ORGS = [
  {
    id: 1,
    name: "עמותת לב חם",
    city: "תל אביב",
    items: "בגדי נשים וילדים",
    status: "active",
  },
  {
    id: 2,
    name: "ידיים לעתיד",
    city: "חיפה",
    items: "בגדי גברים, נעליים",
    status: "active",
  },
  {
    id: 3,
    name: "נשים בקהילה",
    city: "ירושלים",
    items: "בגדי חורף, שמיכות",
    status: "pending",
  },
];

// פריטים חדשים שהתקבלו מהעמותות
// itemStatus: "new" | "added" (הוסף למלאי)
const INITIAL_NEW_ITEMS = [
  {
    id: 1,
    title: "3 שקיות – בגדי נשים",
    org: "עמותת לב חם",
    condition: "מצב טוב",
    itemStatus: "new",
  },
  {
    id: 2,
    title: "שק – נעלי ילדים",
    org: "ידיים לעתיד",
    condition: "כמו חדש",
    itemStatus: "new",
  },
  {
    id: 3,
    title: "2 שקיות – מעילים לגברים",
    org: "עמותת לב חם",
    condition: "מצב סביר",
    itemStatus: "new",
  },
  {
    id: 4,
    title: "שק – בגדי ילדים מעורב",
    org: "נשים בקהילה",
    condition: "מצב טוב",
    itemStatus: "new",
  },
];

// ─── כרטיס KPI ───────────────────────────────────────────────────────────────
// מציג מדד אחד: אייקון + מספר + תווית
function KpiCard({ kpi }) {
  return (
    <div className="bg-rw-card rounded-2xl p-4 shadow-sm
                    flex flex-col items-center gap-1 flex-1">
      <span className="text-2xl">{kpi.icon}</span>
      <span className="text-xl font-bold text-rw-title">{kpi.value}</span>
      <span className="text-[11px] text-rw-sub text-center leading-tight">
        {kpi.label}
      </span>
    </div>
  );
}

// ─── כרטיס עמותה שותפת ───────────────────────────────────────────────────────
// מציג שם / עיר / סוג פריטים / תג סטטוס
function PartnerCard({ org }) {
  const isActive = org.status === "active";
  return (
    <div className="bg-rw-card rounded-2xl shadow-sm p-4
                    flex items-center justify-between">
      {/* תג סטטוס */}
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0
        ${isActive
          ? "bg-green-50 text-green-600"
          : "bg-amber-50 text-amber-500"}`}>
        {isActive ? "פעיל" : "ממתין"}
      </span>

      {/* פרטי עמותה */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end gap-0.5">
          <span className="font-bold text-rw-title text-sm">{org.name}</span>
          <span className="text-rw-sub text-xs">{org.city}</span>
          <span className="text-rw-green text-xs font-medium">{org.items}</span>
        </div>
        {/* אווטאר עמותה */}
        <div className="w-10 h-10 rounded-full bg-rw-logo
                        flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">
            {org.name.charAt(0)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── כרטיס פריט חדש ──────────────────────────────────────────────────────────
// מציג פריט שהגיע מעמותה + כפתור "הוסף למלאי"
// כשלוחצים → itemStatus משתנה ל-"added" (דרך callback)
function NewItemCard({ item, onAdd }) {
  const isAdded = item.itemStatus === "added";
  return (
    <div className="bg-rw-card rounded-2xl shadow-sm p-4
                    flex items-center justify-between">
      {/* כפתור פעולה */}
      {isAdded ? (
        <span className="text-green-600 text-xs font-bold shrink-0">
          ✓ במלאי
        </span>
      ) : (
        <button
          onClick={() => onAdd(item.id)}
          className="bg-rw-btn text-white rounded-xl px-3 py-2
                     text-xs font-semibold active:bg-rw-btn-hover shrink-0">
          הוסף למלאי
        </button>
      )}

      {/* פרטי פריט */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end gap-0.5">
          <span className="font-semibold text-rw-title text-sm">
            {item.title}
          </span>
          <span className="text-rw-sub text-xs">מאת: {item.org}</span>
          <span className="text-rw-green text-xs font-medium">
            {item.condition}
          </span>
        </div>
        <div className="w-10 h-10 bg-rw-input rounded-xl
                        flex items-center justify-center shrink-0">
          <span className="text-xl">🛍️</span>
        </div>
      </div>
    </div>
  );
}

// ─── ShopHomePage ─────────────────────────────────────────────────────────────
export default function ShopHomePage() {
  const navigate = useNavigate();

  // State: מעקב אחרי פריטים שהוספו למלאי
  // כשלוחצים "הוסף למלאי" → itemStatus של אותו פריט משתנה ל-"added"
  // בעתיד: await api.post('/shop/inventory', { itemId: id })
  const [newItems, setNewItems] = useState(INITIAL_NEW_ITEMS);

  const handleAddToInventory = (id) => {
    setNewItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, itemStatus: "added" } : item
      )
    );
  };

  const addedCount = newItems.filter((i) => i.itemStatus === "added").length;

  return (
    <div className="min-h-screen bg-rw-bg pb-24 overflow-y-auto">

      {/* ── 1. Header ─────────────────────────────────────────────────── */}
      <div className="bg-rw-card px-5 pt-6 pb-4 shadow-sm
                      flex items-center justify-between">
        {/* שם חנות + תיאור */}
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-rw-title text-base">
              בגדי הלב – יד שנייה
            </h1>
            <span className="text-xl">🏪</span>
          </div>
          <p className="text-rw-sub text-xs mt-0.5">
            חנות יד שנייה בשיתוף עמותות
          </p>
        </div>
        {/* פעמון */}
        <div
          onClick={() => navigate("/shop/notifications")}
          className="w-10 h-10 bg-rw-input rounded-xl
                     flex items-center justify-center cursor-pointer shrink-0">
          <span className="text-lg">🔔</span>
        </div>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-6">

        {/* ── 2. KPI Cards ──────────────────────────────────────────────
            שלושה כרטיסים בשורה אחת ב-grid.
            flex-1 מבטיח שכולם שווי גודל.
        ────────────────────────────────────────────────────────────── */}
        <div>
          <h2 className="font-bold text-rw-title text-base mb-3">סיכום</h2>
          <div className="flex gap-3">
            {KPI_DATA.map((kpi) => (
              <KpiCard key={kpi.id} kpi={kpi} />
            ))}
          </div>
        </div>

        {/* ── 3. עמותות שותפות ──────────────────────────────────────────
            רשימת PARTNER_ORGS – נתונים סטטיים (אין state כי אין פעולות).
            בעתיד: יוחלפו ב-useEffect + api.get('/shop/partners')
        ────────────────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span
              onClick={() => navigate("/shop/partners")}
              className="text-rw-green text-sm cursor-pointer font-medium">
              הכל
            </span>
            <h2 className="font-bold text-rw-title text-base">עמותות שותפות</h2>
          </div>
          <div className="flex flex-col gap-3">
            {PARTNER_ORGS.map((org) => (
              <PartnerCard key={org.id} org={org} />
            ))}
          </div>
        </div>

        {/* ── 4. פריטים חדשים ───────────────────────────────────────────
            newItems הוא state – לחיצה על "הוסף למלאי" מעדכנת את itemStatus.
            הכפתור נעלם ומוחלף ב-"✓ במלאי" כדי למנוע לחיצה כפולה.
            addedCount מציג כמה נוספו – כמו counter חי.
        ────────────────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            {addedCount > 0 && (
              <span className="bg-green-50 text-green-600 text-xs font-bold
                               px-2.5 py-0.5 rounded-full">
                {addedCount} נוספו ✓
              </span>
            )}
            <h2 className="font-bold text-rw-title text-base">
              פריטים חדשים שהתקבלו
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            {newItems.map((item) => (
              <NewItemCard
                key={item.id}
                item={item}
                onAdd={handleAddToInventory}
              />
            ))}
          </div>
        </div>

      </div>

      {/* ── 5. BottomNav ──────────────────────────────────────────────── */}
      <ShopBottomNav active="home" />
    </div>
  );
}
