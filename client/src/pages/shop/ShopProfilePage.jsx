// src/pages/shop/ShopProfilePage.jsx
// פרופיל חנות יד שנייה עם הגדרות זמינות

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import ShopBottomNav from "../../components/ShopBottomNav";
import { useToast } from "../../hooks/useToast";
import PageContainer from "../../components/PageContainer";

function Toggle({ value, onChange }) {
  return (
    <div onClick={onChange}
      className={`w-12 h-6 rounded-full cursor-pointer transition-colors
                  flex items-center px-1
                  ${value ? "bg-rw-btn" : "bg-gray-300"}`}>
      <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform
                       ${value ? "translate-x-6" : "translate-x-0"}`} />
    </div>
  );
}

export default function ShopProfilePage() {
  const navigate = useNavigate();
  const { user, logout, getShopSettings, updateShopSettings } = useUser();
  const toast = useToast();

  const shopName = user?.shopName || user?.fullName || "החנות שלי";
  const shopCity = user?.city || "";

  // הגדרות זמינות — נטענות מ-Context/localStorage (ראו getShopSettings ב-
  // UserContext.jsx, אותו דפוס בדיוק כמו getOrgSettings). אין endpoint
  // בשרת לזה (SecondHandStores אין לו עמודות הגדרות/זמינות בכלל).
  const initialSettings = getShopSettings(shopName);
  const [isAvailable,   setIsAvailable]   = useState(initialSettings.isAvailable);
  const [acceptsPickup, setAcceptsPickup] = useState(initialSettings.acceptsPickup);
  const [itemTypes,     setItemTypes]     = useState(initialSettings.itemTypes);

  const handleSave = () => {
    updateShopSettings(shopName, { isAvailable, acceptsPickup, itemTypes });
    toast.success("ההגדרות נשמרו בהצלחה");
  };

  const toggleItemType = (key) => {
    setItemTypes(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const ITEM_TYPE_LABELS = {
    women:    "בגדי נשים",
    men:      "בגדי גברים",
    children: "בגדי ילדים",
    shoes:    "נעליים",
    bags:     "תיקים ואקססוריז",
  };

  if (!user) return null;

  return (
    <PageContainer className="pb-24 overflow-y-auto" wide>

      {/* Header */}
      <div className="bg-rw-card px-5 pt-6 pb-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => { logout(); navigate("/"); }}
            className="text-xs text-rw-sub border border-rw-border
                       rounded-xl px-3 py-1.5 active:bg-rw-input">
            התנתקות
          </button>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <h1 className="font-bold text-rw-title text-lg">{shopName}</h1>
              {shopCity && <p className="text-rw-sub text-xs">📍 {shopCity}</p>}
              <p className="text-rw-sub text-xs mt-0.5">{user?.email}</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-rw-logo
                            flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {shopName.charAt(0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-5">

        {/* זמינות כללית */}
        <div className="bg-rw-card rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-rw-title text-base mb-4 text-right">
            הגדרות זמינות
          </h2>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <Toggle value={isAvailable} onChange={() => setIsAvailable(p => !p)} />
              <div className="flex flex-col items-end">
                <span className="font-semibold text-rw-title text-sm">
                  פנויה לאיסוף מבתי תורמים
                </span>
                <span className="text-rw-sub text-xs">
                  מאפשר לעמותות לבחור בחנות לביצוע איסוף מהתורם.
                </span>
              </div>
            </div>

            <div className="h-px bg-rw-border" />

            <div className="flex items-center justify-between">
              <Toggle value={acceptsPickup} onChange={() => setAcceptsPickup(p => !p)} />
              <div className="flex flex-col items-end">
                <span className="font-semibold text-rw-title text-sm">
                  איסוף מבית התורם
                </span>
                <span className="text-rw-sub text-xs">
                  {acceptsPickup ? "מגיעים לאסוף מהתורם עבור העמותה" : "רק הגעה עצמית"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* סוגי פריטים */}
        <div className="bg-rw-card rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-rw-title text-base mb-4 text-right">
            סוגי פריטים שהחנות מטפלת בהם
          </h2>
          <div className="flex flex-col gap-4">
            {Object.entries(ITEM_TYPE_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <Toggle value={itemTypes[key]} onChange={() => toggleItemType(key)} />
                <span className="font-semibold text-rw-title text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* שמירה */}
        <button onClick={handleSave}
          className="w-full bg-rw-btn text-white rounded-2xl py-4
                     text-sm font-semibold active:bg-rw-btn-hover">
          שמירת הגדרות
        </button>

      </div>

      <ShopBottomNav active="profile" />
    </PageContainer>
  );
}
