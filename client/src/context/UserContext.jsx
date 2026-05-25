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

  // ─── שיתופי פעולה בין עמותה לחנות ───────────────────────────────────────
  // כל רשומה: { id, orgName, orgCity, orgTypes, shopName, shopCity,
  //             shopItems, status, date, messages[] }
  // status: "pending" | "approved" | "rejected"
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
      bags,
      date:   new Date().toLocaleDateString("he-IL"),
      status: "ממתין לאיסוף"
    };
    setDonationsState(prev => [...prev, newDonation]);
  };

  const sendDonationToOrg = (bag, org) => {
    const newSent = {
      id:              Date.now(),
      bag, org,
      status:          "pending",
      date:            new Date().toLocaleDateString("he-IL"),
      pickupScheduled: false,
      hasChat:         false,
    };
    setSentDonationsState(prev => [...prev, newSent]);
  };

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
      messages: [],
    };
    setCollaborationsState(prev => [...prev, newCollab]);
    return true;
  };

  // חנות מאשרת או דוחה בקשה
  // נקראת מ-ShopPartnersPage
  const updateCollaboration = (id, updates) => {
    setCollaborationsState(prev =>
      prev.map(c => c.id === id ? { ...c, ...updates } : c)
    );
  };

  // שליחת הודעה בצ'אט של שיתוף פעולה
  // sender: "org" | "shop"
  const sendCollabMessage = (collabId, text, sender) => {
    const newMsg = {
      id:     Date.now(),
      text,
      sender,
      time:   new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
    };
    setCollaborationsState(prev =>
      prev.map(c => c.id === collabId
        ? { ...c, messages: [...(c.messages || []), newMsg] }
        : c
      )
    );
  };

  const unreadCount = sentDonations.filter(d => !d.pickupScheduled).length;

  return (
    <UserContext.Provider value={{
      user, setUser, logout,
      donations, addDonation,
      sentDonations, sendDonationToOrg, updateSentDonation,
      unreadCount,
      orgSettings, updateOrgSettings, getOrgSettings,
      collaborations,
      sendCollaborationRequest,
      updateCollaboration,
      sendCollabMessage,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
