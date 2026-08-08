import { createContext, useEffect, useState } from "react";
import { useUser } from "./UserContext";
import { loadInventoryFor } from "../utils/shopInventoryStorage";

export const NotificationContext = createContext(null);

const STORAGE_KEY = "rewear_notifications";

function loadAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveAll(all) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
  
  }
}

export function NotificationProvider({ children }) {
  const { user, sentDonations, collaborations } = useUser();
  const [all, setAll] = useState(loadAll);

  useEffect(() => {
    saveAll(all);
  }, [all]);

  const orgName  = user?.orgName || 'עמותת "לב חם"';
  const shopName = user?.shopName || user?.fullName || null;
  const ownerKey = user?.type === "org" ? orgName
                 : user?.type === "shop" ? shopName
                 : null;

  useEffect(() => {
    if (!ownerKey || (user.type !== "org" && user.type !== "shop")) return;

    setAll(prev => {
      const existing = prev[ownerKey] || [];
      const seen = new Set(existing.map(n => `${n.type}|${n.relatedId}`));
      const fresh = [];

      const add = (type, relatedId, title, message, targetRoute) => {
        const key = `${type}|${relatedId}`;
        if (seen.has(key)) return;
        seen.add(key);
        fresh.push({
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          role: user.type,
          type,
          title,
          message,
          timestamp: Date.now(),
          isRead: false,
          relatedId,
          targetRoute,
        });
      };

      if (user.type === "org") {
        (sentDonations || []).forEach(d => {
          if (d.status === "pending") {
            add("donation_request", `donation_${d.id}`, "בקשת תרומה חדשה",
              "בקשת תרומה חדשה התקבלה", "/org/requests");
          }
          if (d.pickupScheduled) {
            add("pickup_update", `pickup_${d.id}`, "עדכון תיאום איסוף",
              "התורמת בחרה מועד לאיסוף", "/org/pickups");
          }
          if (d.status === "collected") {
            add("donation_completed", `collected_${d.id}`, "תרומה התקבלה",
              "התרומה סומנה כהתקבלה", "/org/pickups");
          }
        });
        (collaborations || []).forEach(c => {
          if (c.status === "approved") {
            add("collaboration_status", `collab_approved_${c.id}`, "עדכון שיתוף פעולה",
              `${c.shopName} אישרה את בקשת שיתוף הפעולה`, "/org/collaborations");
          }
          (c.messages || []).forEach(m => {
            if (m.sender === "shop") {
              add("chat_message", `msg_${c.id}_${m.id}`, "הודעה חדשה",
                `התקבלה הודעה חדשה מ${c.shopName}`, `/org/chat/${c.id}`);
            }
          });
        });
      }

      if (user.type === "shop") {
        (collaborations || []).forEach(c => {
          if (c.status === "pending") {
            add("collaboration_request", `collab_req_${c.id}`, "בקשת שיתוף פעולה חדשה",
              `בקשת שיתוף פעולה חדשה מעמותת ${c.orgName}`, "/shop/partners");
          }
          if (c.status === "approved") {
            add("collaboration_active", `collab_active_${c.id}`, "שיתוף פעולה פעיל",
              `שיתוף הפעולה עם עמותת ${c.orgName} פעיל`, "/shop/partners");
          }
          (c.messages || []).forEach(m => {
            if (m.sender === "org") {
              if (m.text?.startsWith("📦 פרטי איסוף")) {
                add("pickup_details", `msg_${c.id}_${m.id}`, "פרטי איסוף התקבלו",
                  `התקבלו פרטי איסוף חדשים מעמותת ${c.orgName}`, `/shop/chat/${c.id}`);
              } else {
                add("chat_message", `msg_${c.id}_${m.id}`, "הודעה חדשה",
                  `הודעה חדשה מעמותת ${c.orgName}`, `/shop/chat/${c.id}`);
              }
            }
          });
        });

        const pendingItems = loadInventoryFor(shopName).filter(i => i.status === "pending");
        pendingItems.forEach(item => {
          add("sorting_pending", `sorting_${item.id}`, "פריטים ממתינים למיון",
            "פריטים חדשים ממתינים למיון", "/shop/inventory");
        });
      }

      if (fresh.length === 0) return prev; // אין שינוי אמיתי — לא יוצרים רינדור מיותר
      return { ...prev, [ownerKey]: [...fresh, ...existing] };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.type, ownerKey, sentDonations, collaborations]);

  const myNotifications = (ownerKey ? all[ownerKey] || [] : [])
    .slice()
    .sort((a, b) => b.timestamp - a.timestamp);

  const unreadCount = myNotifications.filter(n => !n.isRead).length;

  const markAsRead = (id) => {
    if (!ownerKey) return;
    setAll(prev => ({
      ...prev,
      [ownerKey]: (prev[ownerKey] || []).map(n =>
        n.id === id ? { ...n, isRead: true } : n
      ),
    }));
  };

  const markAllAsRead = () => {
    if (!ownerKey) return;
    setAll(prev => ({
      ...prev,
      [ownerKey]: (prev[ownerKey] || []).map(n => ({ ...n, isRead: true })),
    }));
  };

  return (
    <NotificationContext.Provider value={{
      notifications: myNotifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}
