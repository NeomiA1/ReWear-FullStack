
const AGE_TO_CATEGORY = {
  "תינוקות": "baby",
  "ילדים":   "children",
  "נוער":    "teen",
  "מבוגרים": "adult",
  "קשישים":  "elderly",
};

function normalizeText(value) {
  return (value ?? "").toString().trim();
}

export function getBagCategory(bag) {
  if (!bag) return null;
  return AGE_TO_CATEGORY[normalizeText(bag.age)] || null;
}
export function normalizeAssociation(raw) {

  return {
    id: raw?.id,
    name: normalizeText(raw?.name),
    email: raw?.email || "",
    city: normalizeText(raw?.city),
    area: normalizeText(raw?.area),
    latitude: typeof raw?.latitude === "number" ? raw.latitude : null,
    longitude: typeof raw?.longitude === "number" ? raw.longitude : null,
    causes: Array.isArray(raw?.causes) ? raw.causes : [],
    acceptedCategories: Array.isArray(raw?.acceptedCategories) ? raw.acceptedCategories : [],
    currentNeeds: Array.isArray(raw?.currentNeeds) ? raw.currentNeeds : [],
    types: raw?.types || "",
    deliveryMode: raw?.deliveryMode || "",
    joinedAt: raw?.joinedAt || null,
    isAvailableDefault: raw?.isAvailableDefault !== false,
  };
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function distanceScore(user, org) {
  const userLat = typeof user?.latitude === "number" ? user.latitude : null;
  const userLon = typeof user?.longitude === "number" ? user.longitude : null;

  if (userLat != null && userLon != null && org.latitude != null && org.longitude != null) {
    const km = haversineKm(userLat, userLon, org.latitude, org.longitude);
    if (km <= 5)  return { points: 20, reason: "קרובה מאוד למיקום שלך" };
    if (km <= 15) return { points: 12, reason: "לא רחוקה ממך" };
    if (km <= 40) return { points: 5,  reason: null };
    return { points: 0, reason: null };
  }

  const userCity = normalizeText(user?.city || user?.location);
  if (!userCity || !org.city) {
    return { points: 5, reason: null }; 
  }
  if (userCity === org.city) {
    return { points: 20, reason: "קרובה למיקום שלך" };
  }
  if (org.area && userCity && normalizeText(user?.area) === org.area) {
    return { points: 12, reason: "באזור שלך" };
  }
  return { points: 0, reason: null };
}

function categoryScore(bagCategory, org) {
  if (!bagCategory) return { points: 0, reason: null };

  if (org.currentNeeds.includes(bagCategory)) {
    return { points: 35, reason: "current_need", meta: bagCategory };
  }
  if (org.acceptedCategories.includes(bagCategory)) {
    return { points: 25, reason: "accepts", meta: bagCategory };
  }
  if (org.acceptedCategories.includes("general")) {
    return { points: 12, reason: "accepts_general", meta: null };
  }
  return { points: 0, reason: null };
}

function causeScore(org, preferredCauses) {
  if (!preferredCauses || preferredCauses.length === 0) {
    return { points: 0, matched: [] };
  }
  const matched = org.causes.filter((c) => preferredCauses.includes(c));
  return { points: Math.min(30, matched.length * 15), matched };
}

function historyScore(org, profile) {
  let points = 0;
  const reasons = [];
  if (profile.selectedAssociationIds?.includes(org.id)) {
    points += 6;
    reasons.push("previously_selected");
  }
  const donated = profile.donatedCategories || [];
  if (donated.some((c) => org.acceptedCategories.includes(c))) {
    points += 4;
    reasons.push("donated_category_match");
  }
  return { points: Math.min(10, points), reasons };
}

function newAssociationBoost(org, now = new Date()) {
  if (!org.joinedAt) return { points: 0 };
  const joined = new Date(org.joinedAt);
  if (Number.isNaN(joined.getTime())) return { points: 0 };
  const daysSince = (now.getTime() - joined.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince <= 30) return { points: 5 };
  if (daysSince <= 90) return { points: 2 };
  return { points: 0 };
}

export function getIsAssociationAvailable(org, orgSettings) {
  const override = orgSettings?.[org.name];
  if (override && typeof override.isAvailable === "boolean") {
    return override.isAvailable;
  }
  return org.isAvailableDefault;
}

const CATEGORY_LABELS_BY_ID = {
  baby: "התינוקות",
  children: "הילדים",
  teen: "הנוער",
  adult: "המבוגרים",
  elderly: "הקשישים",
};
export function getRecommendationPercent(score) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function scoreAssociation(org, { user, bag, preferredCauses, profile, isAvailable, causeLabelsById = {} }) {
  const bagCategory = getBagCategory(bag);

  const dist = distanceScore(user, org);
  const cat = categoryScore(bagCategory, org);
  const cause = causeScore(org, preferredCauses);
  const hist = historyScore(org, profile);
  const fresh = newAssociationBoost(org);

  const score = Math.round(dist.points + cat.points + cause.points + hist.points + fresh.points);

  const candidates = [];

  if (cat.reason === "current_need") {
    candidates.push({
      id: "current_need",
      icon: "🎯",
      text: `העמותה זקוקה כרגע בדיוק לבגדי ${CATEGORY_LABELS_BY_ID[cat.meta] || ""} כמו בשק שלך`,
      weight: cat.points,
    });
  } else if (cat.reason === "accepts") {
    candidates.push({
      id: "category_match",
      icon: "👕",
      text: `מקבלת בגדי ${CATEGORY_LABELS_BY_ID[cat.meta] || ""}, כמו בשק שלך`,
      weight: cat.points,
    });
  } else if (cat.reason === "accepts_general") {
    candidates.push({ id: "category_match", icon: "👕", text: "מקבלת את כל סוגי הבגדים", weight: cat.points });
  }

  if (cause.points > 0) {
    const labels = cause.matched.map((id) => causeLabelsById[id]).filter(Boolean);
    candidates.push({
      id: "causes_match",
      icon: "💚",
      text: labels.length > 0 ? `תואמת נושאים שחשובים לך: ${labels.join(", ")}` : "תואמת נושאים שחשובים לך",
      weight: cause.points,
    });
  }

  if (dist.reason) {
    candidates.push({ id: "distance", icon: "📍", text: dist.reason, weight: dist.points });
  }

  if (hist.reasons.includes("previously_selected")) {
    candidates.push({ id: "previously_selected", icon: "🔁", text: "בחרת בעמותה הזו בעבר", weight: 6 });
  }
  if (hist.reasons.includes("donated_category_match")) {
    candidates.push({ id: "donated_category_match", icon: "🕘", text: "תואמת קטגוריות שתרמת בעבר", weight: 4 });
  }

  if (fresh.points > 0) {
    candidates.push({ id: "new_association", icon: "🆕", text: "עמותה חדשה במערכת", weight: fresh.points });
  }

  if (isAvailable) {
    candidates.push({ id: "available", icon: "✅", text: "פתוחה כרגע לתרומות", weight: 1 });
  }

  const reasons = candidates
    .sort((a, b) => b.weight - a.weight)
    .map(({ id, icon, text }) => ({ id, icon, text }));

  return { score, percent: getRecommendationPercent(score), reasons, bagCategory };
}

export function rankAssociations(associations, { user, bag, profile, orgSettings, now, causeLabelsById = {} } = {}) {
  const preferredCauses = [
    ...new Set([...(profile?.onboardingCauses || []), ...(profile?.selectedCauses || [])]),
  ];

  return associations
    .map(normalizeAssociation)
    .map((org) => {
      const isAvailable = getIsAssociationAvailable(org, orgSettings);
      const { score, percent, reasons, bagCategory } = scoreAssociation(org, {
        user,
        bag,
        preferredCauses,
        profile: profile || {},
        isAvailable,
        causeLabelsById,
      });
    
      const joinedAtTime = org.joinedAt ? new Date(org.joinedAt).getTime() : null;
      return {
        association: org,
        score,
        percent,
        reasons,
        isAvailable,
        bagCategory,
        distancePoints: distanceScore(user, org).points,
        joinedAtTime: Number.isNaN(joinedAtTime) ? null : joinedAtTime,
      };
    })
    .sort((a, b) => {
      if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
      if (b.score !== a.score) return b.score - a.score;
      return a.association.name.localeCompare(b.association.name, "he");
    });
}

export function applyFilters(ranked, { search, causesFilter, categoryFilter, availableOnly } = {}) {
  const q = normalizeText(search).toLowerCase();
  const causes = causesFilter && causesFilter.length > 0 ? causesFilter : null;

  return ranked.filter(({ association: org, isAvailable }) => {
    if (availableOnly && !isAvailable) return false;
    if (q && !org.name.toLowerCase().includes(q) && !org.city.toLowerCase().includes(q)) return false;
    if (causes && !org.causes.some((c) => causes.includes(c))) return false;
    if (categoryFilter && categoryFilter !== "all") {
      const matchesCategory =
        org.acceptedCategories.includes(categoryFilter) || org.acceptedCategories.includes("general");
      if (!matchesCategory) return false;
    }
    return true;
  });
}

export function applyDisplaySort(filtered, sortBy) {
  if (sortBy === "nearest") {
    return [...filtered].sort((a, b) => b.distancePoints - a.distancePoints);
  }
  if (sortBy === "newest") {
    return [...filtered].sort((a, b) => {
      if (a.joinedAtTime == null) return 1;
      if (b.joinedAtTime == null) return -1;
      return b.joinedAtTime - a.joinedAtTime;
    });
  }
  return filtered;
}

export { CATEGORY_LABELS_BY_ID };
