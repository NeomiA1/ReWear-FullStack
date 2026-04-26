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

  // ─── הגדרות עמותה ────────────────────────────────────
  // שומרות את סטטוס הזמינות ואופן הקבלה של כל עמותה
  // המפתח = שם העמותה, הערך = הגדרות
  const [orgSettings, setOrgSettingsState] = useState(() => {
    try {
      const saved = localStorage.getItem("rewear_org_settings");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
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

  const setUser = (userData) => setUserState(userData);

  const logout = () => {
    setUserState(null);
    setDonationsState([]);
    setSentDonationsState([]);
    localStorage.removeItem("rewear_user");
    localStorage.removeItem("rewear_donations");
    localStorage.removeItem("rewear_sent");
  };

  const addDonation = (bags) => {
    const newDonation = {
      id: Date.now(),
      bags,
      date: new Date().toLocaleDateString("he-IL"),
      status: "ממתין לאיסוף"
    };
    setDonationsState(prev => [...prev, newDonation]);
  };

  const sendDonationToOrg = (bag, org) => {
    const newSent = {
      id: Date.now(),
      bag, org,
      status: "pending",
      date: new Date().toLocaleDateString("he-IL"),
      pickupScheduled: false,
      hasChat: false,
    };
    setSentDonationsState(prev => [...prev, newSent]);
  };

  const updateSentDonation = (id, updates) => {
    setSentDonationsState(prev =>
      prev.map(d => d.id === id ? { ...d, ...updates } : d)
    );
  };

  // עדכון הגדרות עמותה
  // orgName = שם העמותה, settings = ההגדרות החדשות
  const updateOrgSettings = (orgName, settings) => {
    setOrgSettingsState(prev => ({
      ...prev,
      [orgName]: { ...prev[orgName], ...settings }
    }));
  };

  // קבלת הגדרות עמותה לפי שם
  const getOrgSettings = (orgName) => {
    return orgSettings[orgName] || {
      isAvailable: true,
      acceptsPickup: true,
      acceptsDropoff: true,
    };
  };

  const unreadCount = sentDonations.filter(d => !d.pickupScheduled).length;

  return (
    <UserContext.Provider value={{
      user, setUser, logout,
      donations, addDonation,
      sentDonations, sendDonationToOrg, updateSentDonation,
      unreadCount,
      orgSettings, updateOrgSettings, getOrgSettings,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}