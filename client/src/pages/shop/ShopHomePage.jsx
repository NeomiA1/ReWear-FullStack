// src/pages/shop/ShopHomePage.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import ShopBottomNav from "../../components/ShopBottomNav";
import PageContainer from "../../components/PageContainer";
import { loadInventoryFor } from "../../utils/shopInventoryStorage";
import { getCollabStatusInfo } from "../../utils/statusLabels";

const INITIAL_NEW_ITEMS = [
  { id: 1, title: "3 שקיות – בגדי נשים",     org: "עמותת לב חם", condition: "מצב טוב",  itemStatus: "new" },
  { id: 2, title: "שק – נעלי ילדים",          org: "ידיים לעתיד", condition: "כמו חדש",  itemStatus: "new" },
  { id: 3, title: "2 שקיות – מעילים לגברים", org: "עמותת לב חם", condition: "מצב סביר", itemStatus: "new" },
  { id: 4, title: "שק – בגדי ילדים מעורב",    org: "נשים בקהילה", condition: "מצב טוב",  itemStatus: "new" },
];

function KpiCard({ kpi }) {
  return (
    <div className="bg-rw-card rounded-2xl p-4 shadow-sm
                    flex flex-col items-center gap-1 flex-1">
      <span className="text-2xl">{kpi.icon}</span>
      <span className="text-xl font-bold text-rw-title">{kpi.value}</span>
      <span className="text-[11px] text-rw-sub text-center leading-tight">{kpi.label}</span>
    </div>
  );
}

// ── עמותה שותפת – מ-collaborations ────────────────────────────────────────────
function PartnerCard({ collab, onChat }) {
  const isActive   = collab.status === "approved";
  const statusInfo = getCollabStatusInfo(collab.status);
  return (
    <div className="bg-rw-card rounded-2xl shadow-sm p-4 flex items-center justify-between">
      {/* כפתור צ'אט אם פעיל */}
      {isActive && (
        <button onClick={() => onChat(collab.id)}
          className="bg-rw-btn/10 text-rw-btn border border-rw-btn/30
                     rounded-xl px-3 py-1.5 text-xs font-semibold shrink-0
                     flex items-center gap-1 active:bg-rw-btn/20">
          <span>💬</span><span>צ׳אט</span>
        </button>
      )}
      <div className="flex items-center gap-3 flex-1 justify-end">
        <div className="flex flex-col items-end gap-0.5">
          <span className="font-bold text-rw-title text-sm">{collab.orgName}</span>
          <span className="text-rw-sub text-xs">{collab.orgCity}</span>
          <span className="text-rw-green text-xs font-medium">{collab.orgTypes}</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-rw-logo flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">{collab.orgName?.charAt(0)}</span>
        </div>
      </div>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 mr-2
        ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    </div>
  );
}

function NewItemCard({ item, onAdd }) {
  const isAdded = item.itemStatus === "added";
  return (
    <div className="bg-rw-card rounded-2xl shadow-sm p-4 flex items-center justify-between">
      {isAdded ? (
        <span className="text-green-600 text-xs font-bold shrink-0">✓ במלאי</span>
      ) : (
        <button onClick={() => onAdd(item.id)}
          className="bg-rw-btn text-white rounded-xl px-3 py-2
                     text-xs font-semibold active:bg-rw-btn-hover shrink-0">
          הוסף למלאי
        </button>
      )}
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end gap-0.5">
          <span className="font-semibold text-rw-title text-sm">{item.title}</span>
          <span className="text-rw-sub text-xs">מאת: {item.org}</span>
          <span className="text-rw-green text-xs font-medium">{item.condition}</span>
        </div>
        <div className="w-10 h-10 bg-rw-input rounded-xl flex items-center justify-center shrink-0">
          <span className="text-xl">🛍️</span>
        </div>
      </div>
    </div>
  );
}

export default function ShopHomePage() {
  const navigate = useNavigate();
  const { user, logout, collaborations } = useUser();

  const [newItems, setNewItems] = useState(INITIAL_NEW_ITEMS);

  const handleAddToInventory = (id) => {
    setNewItems(prev => prev.map(item =>
      item.id === id ? { ...item, itemStatus: "added" } : item
    ));
  };

  const addedCount = newItems.filter(i => i.itemStatus === "added").length;
  const shopName   = user?.shopName || user?.fullName || "בגדי הלב – יד שנייה";

  // ── פריטים במלאי – מהמלאי האמיתי (אותו מקור נתונים כמו ShopInventoryPage) ──
  const shopKey       = user?.shopName || user?.fullName || "default";
  const inventoryItems = loadInventoryFor(shopKey);
  const inStockCount   = inventoryItems.filter(i => i.status === "inShop").length;

  // ── עמותות שותפות מה-Context ─────────────────────────────────────────────
  // מציג רק שיתופים שאושרו או ממתינים (לא נדחו)
  const partnerCollabs = (collaborations || [])
    .filter(c => c.status !== "rejected")
    .slice(0, 3);

  // KPI — "פריטים במלאי" מחושב מהמלאי האמיתי; "פריטים שנמכרו" אין לו שום
  // מעקב במודל הנתונים הקיים (אין מושג "נמכר" בכלל), אז מוצג כ"—" במקום
  // מספר בדוי במקום "37" הקבוע שהיה כאן.
  const kpiWithPartners = [
    { id: 1, label: "פריטים במלאי",   value: String(inStockCount), icon: "👗" },
    { id: 2, label: "עמותות שותפות",  value: String(partnerCollabs.filter(c => c.status === "approved").length), icon: "🤝" },
    { id: 3, label: "פריטים שנמכרו",  value: "—", icon: "✅" },
  ];

  return (
    <PageContainer className="pb-24 overflow-y-auto" wide>

      {/* Header */}
      <div className="bg-rw-card px-5 pt-6 pb-4 shadow-sm
                      flex items-center justify-between">
        <button onClick={() => { logout(); navigate("/"); }}
          className="text-xs text-rw-sub border border-rw-border
                     rounded-xl px-3 py-1.5 active:bg-rw-input shrink-0">
          התנתקות
        </button>
        <div className="flex flex-col items-end flex-1 mx-3">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-rw-title text-base">{shopName}</h1>
            <span className="text-xl">🏪</span>
          </div>
          <p className="text-rw-sub text-xs mt-0.5">חנות יד שנייה בשיתוף עמותות</p>
        </div>
        <div onClick={() => navigate("/shop/partners")}
          className="w-10 h-10 bg-rw-input rounded-xl
                     flex items-center justify-center cursor-pointer shrink-0">
          <span className="text-lg">🔔</span>
        </div>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-6">

        {/* KPI */}
        <div>
          <h2 className="font-bold text-rw-title text-base mb-3">סיכום</h2>
          <div className="flex gap-3">
            {kpiWithPartners.map(kpi => <KpiCard key={kpi.id} kpi={kpi} />)}
          </div>
        </div>

        {/* עמותות שותפות – מ-Context */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span onClick={() => navigate("/shop/partners")}
              className="text-rw-green text-sm cursor-pointer font-medium">
              הכל
            </span>
            <h2 className="font-bold text-rw-title text-base">עמותות שותפות</h2>
          </div>

          {partnerCollabs.length === 0 ? (
            <div className="bg-rw-card rounded-2xl p-4 text-center shadow-sm">
              <p className="text-rw-sub text-sm">אין עמותות שותפות עדיין</p>
              <button onClick={() => navigate("/shop/partners")}
                className="mt-2 text-rw-green text-xs font-semibold">
                צפי בבקשות שיתוף פעולה
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {partnerCollabs.map(collab => (
                <PartnerCard key={collab.id} collab={collab}
                  onChat={(id) => navigate(`/shop/chat/${id}`)} />
              ))}
            </div>
          )}
        </div>

        {/* פריטים חדשים */}
        <div>
          <div className="flex items-center justify-between mb-3">
            {addedCount > 0 && (
              <span className="bg-green-50 text-green-600 text-xs font-bold
                               px-2.5 py-0.5 rounded-full">
                {addedCount} נוספו ✓
              </span>
            )}
            <h2 className="font-bold text-rw-title text-base">פריטים חדשים שהתקבלו</h2>
          </div>
          <div className="flex flex-col gap-3">
            {newItems.map(item => (
              <NewItemCard key={item.id} item={item} onAdd={handleAddToInventory} />
            ))}
          </div>
        </div>

      </div>

      <ShopBottomNav active="home" />
    </PageContainer>
  );
}
