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

  const [orgUrgentNeeds, setOrgUrgentNeedsState] = useState(() => {
    try {
      const saved = localStorage.getItem("rewear_org_urgent_needs");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const [shopSettings, setShopSettingsState] = useState(() => {
    try {
      const saved = localStorage.getItem("rewear_shop_settings");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

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
    localStorage.setItem("rewear_org_urgent_needs", JSON.stringify(orgUrgentNeeds));
  }, [orgUrgentNeeds]);

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

  const myDonations = (() => {
    if (user?.type !== "private") return donations;
    if (user.userId == null) return [];
    return donations.filter(item => item.userId === user.userId);
  })();

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

  const updateUrgentNeeds = (orgName, needs) => {
    setOrgUrgentNeedsState(prev => ({ ...prev, [orgName]: needs }));
  };

  const getUrgentNeeds = (orgName) => {
    return orgUrgentNeeds[orgName] || [];
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

 
  const sendCollaborationRequest = (org, shop) => {
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
    
    };
    setCollaborationsState(prev => [...prev, newCollab]);
    return true;
  };

 
  const updateCollaboration = (id, updates) => {
    setCollaborationsState(prev =>
      prev.map(c => {
        if (c.id !== id) return c;
        const next = { ...c, ...updates };
      
        if (updates.status === "approved" && !next.messages) {
          next.messages = [];
        }
        return next;
      })
    );
  };

 
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
      updateUrgentNeeds, getUrgentNeeds,
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
