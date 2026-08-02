// src/pages/shop/ShopInventoryPage.jsx
// ניהול מלאי החנות – סימון פריטים שנשארו בחנות או עברו לעמותה

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import ShopBottomNav from "../../components/ShopBottomNav";
import PageContainer from "../../components/PageContainer";
import { loadInventoryFor, saveInventoryFor } from "../../utils/shopInventoryStorage";
import { getInventoryStatusInfo } from "../../utils/statusLabels";

const FILTERS = [
  { id: "all",     label: "הכל"          },
  { id: "pending", label: "טרם סומן"     },
  { id: "inShop",  label: "בחנות"        },
  { id: "toOrg",   label: "לעמותה"       },
];

function InventoryCard({ item, onMark }) {
  const statusInfo = getInventoryStatusInfo(item.status);
  const isPending  = item.status === "pending";

  return (
    <div className="bg-rw-card rounded-2xl shadow-sm p-4 flex flex-col gap-3">

      {/* שורה עליונה */}
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0
                         ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end gap-0.5">
            <span className="font-semibold text-rw-title text-sm">{item.title}</span>
            <span className="text-rw-sub text-xs">מאת: {item.org}</span>
            <span className="text-rw-green text-xs font-medium">{item.condition}</span>
          </div>
          <div className="w-10 h-10 bg-rw-input rounded-xl
                          flex items-center justify-center shrink-0">
            <span className="text-xl">🛍️</span>
          </div>
        </div>
      </div>

      {/* כפתורי סימון */}
      {isPending && (
        <div className="flex gap-2">
          <button onClick={() => onMark(item.id, "toOrg")}
            className="flex-1 border border-blue-200 text-blue-500 rounded-xl
                       py-2 text-xs font-semibold active:bg-blue-50">
            עבר לעמותה
          </button>
          <button onClick={() => onMark(item.id, "inShop")}
            className="flex-1 bg-rw-btn text-white rounded-xl
                       py-2 text-xs font-semibold active:bg-rw-btn-hover">
            נשאר בחנות
          </button>
        </div>
      )}

      {/* שינוי סימון */}
      {!isPending && (
        <button onClick={() => onMark(item.id, "pending")}
          className="text-rw-sub text-xs text-right active:opacity-70">
          ← שנה סימון
        </button>
      )}
    </div>
  );
}

export default function ShopInventoryPage() {
  const navigate    = useNavigate();
  const { user }    = useUser();
  const shopKey     = user?.shopName || user?.fullName || "default";
  const [items,     setItems]       = useState(() => loadInventoryFor(shopKey));
  const [filter,    setFilter]      = useState("all");

  useEffect(() => {
    saveInventoryFor(shopKey, items);
  }, [shopKey, items]);

  const handleMark = (id, status) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, status } : item
    ));
    // בעתיד: await api.patch(`/shop/inventory/${id}`, { status })
  };

  const visible = filter === "all" ? items : items.filter(i => i.status === filter);
  const pendingCount = items.filter(i => i.status === "pending").length;
  const inShopCount  = items.filter(i => i.status === "inShop").length;
  const toOrgCount   = items.filter(i => i.status === "toOrg").length;

  return (
    <PageContainer className="pb-24 overflow-y-auto" wide>

      {/* Header */}
      <div className="bg-rw-card px-5 pt-6 pb-4 shadow-sm
                      flex items-center justify-between">
        <div className="flex flex-col items-end">
          <h1 className="font-bold text-rw-title text-base">ניהול מלאי</h1>
          <p className="text-rw-sub text-xs mt-0.5">
            {pendingCount > 0 ? `${pendingCount} פריטים טרם סומנו` : "כל הפריטים סומנו ✓"}
          </p>
        </div>
        <div className="w-10 h-10 bg-rw-input rounded-xl
                        flex items-center justify-center">
          <span className="text-lg">📦</span>
        </div>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-4">

        {/* סיכום */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "טרם סומן", value: pendingCount, color: "text-amber-500" },
            { label: "בחנות",    value: inShopCount,  color: "text-green-600" },
            { label: "לעמותה",   value: toOrgCount,   color: "text-blue-500"  },
          ].map(stat => (
            <div key={stat.label}
              className="bg-rw-card rounded-2xl p-3 shadow-sm text-center">
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-rw-sub text-xs mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* פילטרים */}
        <div className="flex gap-2 overflow-x-auto pb-1 justify-end">
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold
                         whitespace-nowrap transition-colors
                         ${filter === f.id
                           ? "bg-rw-btn text-white"
                           : "bg-rw-card text-rw-sub border border-rw-border"}`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* רשימת פריטים */}
        {visible.length > 0 ? (
          visible.map(item => (
            <InventoryCard key={item.id} item={item} onMark={handleMark} />
          ))
        ) : (
          <div className="flex flex-col items-center gap-3 pt-10">
            <span className="text-4xl">📭</span>
            <p className="text-rw-sub text-sm">אין פריטים להצגה</p>
          </div>
        )}

      </div>

      <ShopBottomNav active="inventory" />
    </PageContainer>
  );
}
