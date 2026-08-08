import { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext(null);

export function UserProvider({ children }) {

  const [user, setUserState] = useState(() => {
    try {
      const saved = localStorage.getItem("rewear_user");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [donations, setDonationsState] = useState(() => {
    try {
      const saved = localStorage.getItem("rewear_donations");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [sentDonations, setSentDonationsState] = useState(() => {
    try {
      const saved = localStorage.getItem("rewear_sent");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [orgSettings, setOrgSettingsState] = useState(() => {
    try {
      const saved = localStorage.getItem("rewear_org_settings");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  // מפה { [שם חנות]: settings } — אין endpoint בשרת לזה (SecondHandStores
  // אין לו עמודות הגדרות/זמינות כלל, בניגוד ל-Associations), אז שומרים
  // באותו דפוס בדיוק כמו orgSettings, תחת מפתח נפרד כדי שלא יתנגש עם שם
  // עמותה זהה במקרה.
  const [shopSettings, setShopSettingsState] = useState(() => {
    try {
      const saved = localStorage.getItem("rewear_shop_settings");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  // ─── שיתופי פעולה בין עמותה לחנות ───────────────────────────────────────
  // כל רשומה: { id, orgName, orgCity, orgTypes, shopName, shopCity,
  //             shopItems, status, date, messages[]? }
  // status: "pending" | "approved" | "rejected"
  // messages קיים רק לאחר אישור (הצ'אט "נוצר" באותו רגע) — ראו
  // updateCollaboration ו-sendCollaborationRequest למטה.
  const [collaborations, setCollaborationsState] = useState(() => {
    try {
      const saved = localStorage.getItem("rewear_collaborations");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    if (user) localStorage.setItem("rewear_user", JSON.stringify(user));
    else localStorage.removeItem("rewear_user");
  }, [user]);

  useEffect(() => {
    localStorage.setItem("rewear_donations", JSON.stringify(donations));
  }, [donations]);

  useEffect(() => {
    localStorage.setItem("rewear_sent", JSON.stringify(sentDonations));
  }, [sentDonations]);

  useEffect(() => {
    localStorage.setItem("rewear_org_settings", JSON.stringify(orgSettings));
  }, [orgSettings]);

  useEffect(() => {
    localStorage.setItem("rewear_shop_settings", JSON.stringify(shopSettings));
  }, [shopSettings]);

  useEffect(() => {
    localStorage.setItem("rewear_collaborations", JSON.stringify(collaborations));
  }, [collaborations]);

  const setUser = (userData) => setUserState(userData);

  const logout = () => {
    setUserState(null);
    localStorage.removeItem("rewear_user");
  };

  const addDonation = (bags) => {
    const newDonation = {
      id:     Date.now(),
      userId: user?.userId ?? null,
      bags,
      date:   new Date().toLocaleDateString("he-IL"),
      status: "ממתין לאיסוף"
    };
    setDonationsState(prev => [...prev, newDonation]);
  };

  const sendDonationToOrg = (bag, org) => {
    const newSent = {
      id:              Date.now(),
      userId:          user?.userId ?? null,
      bag, org,
      donor:           bag.donor || "תורם",  // ← שם התורם לתצוגה בעמותה
      status:          "pending",
      date:            new Date().toLocaleDateString("he-IL"),
      pickupScheduled: false,
      hasChat:         false,
    };
    setSentDonationsState(prev => [...prev, newSent]);
  };

  // ─── סינון לפי המשתמש המחובר ─────────────────────────────────────────────
  // donations/sentDonations/collaborations נשמרים תחת מפתחות localStorage
  // גלובליים (לא לפי משתמש), אז בלי הסינון הזה כל חשבון חדש "יורש" נתונים
  // של חשבונות קודמים באותו דפדפן. donations (טיוטות דמו) רלוונטי רק
  // למשתמש פרטי. sentDonations/collaborations מסוננים גם לפי עמותה מחוברת.
  // הצד של החנות ממשיך להשתמש ברשימה המלאה כרגע (Step הבא בתוכנית).
  const myDonations = (() => {
    if (user?.type !== "private") return donations;
    if (user.userId == null) return [];
    return donations.filter(item => item.userId === user.userId);
  })();

  // user.orgName נקבע רק בהרשמה (RegisterOrgPage) — לאחר login רגיל הוא
  // חסר. אותה נפילת-ברירת-מחדל בדיוק כמו ב-OrgHomePage/OrgProfilePage, כדי
  // שעמותה תמשיך לראות את מה שהיא עצמה יצרה תחת אותו שם.
  const effectiveOrgName = user?.orgName || 'עמותת "לב חם"';

  const mySentDonations = (() => {
    if (user?.type === "private") {
      if (user.userId == null) return [];
      return sentDonations.filter(item => item.userId === user.userId);
    }
    if (user?.type === "org") {
      return sentDonations.filter(item => item.org?.name === effectiveOrgName);
    }
    return sentDonations;
  })();

  const myCollaborations = (() => {
    if (user?.type === "org") {
      return collaborations.filter(c => c.orgName === effectiveOrgName);
    }
    if (user?.type === "shop") {
      // TODO(server): shops are matched by display name only — OrgHomePage
      // still picks from a hardcoded store list (AVAILABLE_STORES), not real
      // registered shops, since there's no endpoint to browse real ones tied
      // to an org's real associationId (same class of gap as the missing
      // associations list — see associationService.js). A real shop account
      // whose name never appears in that hardcoded list will correctly see
      // no requests, rather than someone else's.
      const effectiveShopName = user?.shopName || user?.fullName || null;
      if (!effectiveShopName) return [];
      return collaborations.filter(c => c.shopName === effectiveShopName);
    }
    return collaborations;
  })();

  const updateSentDonation = (id, updates) => {
    setSentDonationsState(prev =>
      prev.map(d => d.id === id ? { ...d, ...updates } : d)
    );
  };

  const updateOrgSettings = (orgName, settings) => {
    setOrgSettingsState(prev => ({
      ...prev,
      [orgName]: { ...prev[orgName], ...settings }
    }));
  };

  const getOrgSettings = (orgName) => {
    return orgSettings[orgName] || {
      isAvailable:    true,
      acceptsPickup:  true,
      acceptsDropoff: true,
    };
  };

  const updateShopSettings = (shopName, settings) => {
    setShopSettingsState(prev => ({
      ...prev,
      [shopName]: { ...prev[shopName], ...settings }
    }));
  };

  const getShopSettings = (shopName) => {
    return shopSettings[shopName] || {
      isAvailable:   true,
      acceptsPickup: true,
      itemTypes: {
        women:    true,
        men:      true,
        children: true,
        shoes:    false,
        bags:     false,
      },
    };
  };

  // ─── פונקציות שיתוף פעולה ────────────────────────────────────────────────

  // עמותה שולחת בקשת שיתוף פעולה לחנות
  // נקראת מ-OrgHomePage כשלוחצים "שלחי בקשת שיתוף פעולה"
  const sendCollaborationRequest = (org, shop) => {
    // בדיקה שלא שלחו כבר בקשה לאותה חנות
    const alreadySent = collaborations.some(
      c => c.orgName === org.name && c.shopName === shop.name &&
           c.status !== "rejected"
    );
    if (alreadySent) return false;

    const newCollab = {
      id:       Date.now(),
      orgName:  org.name,
      orgCity:  org.city  || "",
      orgTypes: org.types || org.items || "",
      shopName: shop.name,
      shopCity: shop.city,
      shopItems:shop.items,
      status:   "pending",
      date:     new Date().toLocaleDateString("he-IL"),
      // אין messages כאן בכוונה — הצ'אט "נוצר" רק כשהבקשה מאושרת, ראו
      // updateCollaboration למטה. אם הבקשה תידחה, לא ייווצר צ'אט בכלל.
    };
    setCollaborationsState(prev => [...prev, newCollab]);
    return true;
  };

  // חנות מאשרת או דוחה בקשה
  // נקראת מ-ShopPartnersPage
  const updateCollaboration = (id, updates) => {
    setCollaborationsState(prev =>
      prev.map(c => {
        if (c.id !== id) return c;
        const next = { ...c, ...updates };
        // הצ'אט נוצר בפועל (מערך הודעות מאותחל) רק ברגע שהבקשה מאושרת —
        // לא לפני, ולא אם היא נדחית.
        if (updates.status === "approved" && !next.messages) {
          next.messages = [];
        }
        return next;
      })
    );
  };

  // הוספת הודעה בצ'אט של שיתוף פעולה — message: { sender: "org"|"shop", senderName, text, date }
  const addCollaborationMessage = (collabId, message) => {
    const newMsg = { id: Date.now(), ...message };
    setCollaborationsState(prev =>
      prev.map(c => c.id === collabId
        ? { ...c, messages: [...(c.messages || []), newMsg] }
        : c
      )
    );
  };

  const unreadCount = mySentDonations.filter(d => !d.pickupScheduled).length;

  return (
    <UserContext.Provider value={{
      user, setUser, logout,
      donations: myDonations, addDonation,
      sentDonations: mySentDonations, sendDonationToOrg, updateSentDonation,
      unreadCount,
      orgSettings, updateOrgSettings, getOrgSettings,
      shopSettings, updateShopSettings, getShopSettings,
      collaborations: myCollaborations,
      sendCollaborationRequest,
      updateCollaboration,
      addCollaborationMessage,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
