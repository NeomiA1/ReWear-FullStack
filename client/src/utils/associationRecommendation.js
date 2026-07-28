// מנוע המלצות עמותות — מרכזי, צד-לקוח בלבד, מבוסס-חוקים ושקוף.
// משמש את כל מסכי בחירת העמותה (ProfilePage אחרי העלאת שק, MapPage) כדי
// שכולם יחזירו בדיוק אותו סדר עבור אותו משתמש/שק/עמותות/היסטוריה.
//
// עקרון מפתח: הניקוד וה-*סינון* הם שני שלבים נפרדים לגמרי.
//   rankAssociations()  → מנקד וממיין לפי onboarding + היסטוריה + השק
//                          הנוכחי + זמינות. לא מושפע מהפילטר החי של המסך.
//   applyFilters()       → מצמצם את הרשימה המדורגת (חיפוש/נושאים/קטגוריה/
//                          זמינות-בלבד) בלי לשנות את הניקוד של אף עמותה.
//   applyDisplaySort()   → מיון תצוגה חלופי ("קרוב אליי"/"חדש במערכת"),
//                          גם הוא לא משנה את הניקוד, רק את סדר ההצגה.
//
// חלוקת הניקוד (סה"כ 100, שקוף ומבוסס-חוקים):
//   התאמת קטגוריית השק הנוכחי   — עד 35
//   התאמת נושאים מועדפים        — עד 30
//   מרחק                        — עד 20
//   בחירות/תרומות קודמות קשורות — עד 10
//   בוסט "עמותה חדשה"           — עד 5
// זמינות אינה חלק מ-100 הנקודות — היא ממד מיון/סינון נפרד (עמותות זמינות
// תמיד מקובצות מעל לא-זמינות במיון "מומלץ", ראו rankAssociations).

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

// שק בלי גיל מוגדר (או בלי שק בכלל) → אין קטגוריה, לא נענש ולא מקבל בונוס.
export function getBagCategory(bag) {
  if (!bag) return null;
  return AGE_TO_CATEGORY[normalizeText(bag.age)] || null;
}

// ממלא ברירות מחדל בטוחות לשדות המלצה חסרים, כך שנתוני עמותה חלקיים
// (או עתידיים, מ-API אמיתי) לא יגרמו לקריסה או ל-NaN.
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

// עד 20 נקודות. אם יש קואורדינטות אמיתיות משני הצדדים — מרחק אמיתי.
// אחרת (המצב היום, אין geocoding) נופל חזרה לעיר/אזור. אם המיקום לא ידוע
// באחד הצדדים — ניקוד ניטרלי (לא עונשי), כדי לא להעניש משתמש בלי מיקום.
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
    return { points: 5, reason: null }; // מיקום לא ידוע — ניטרלי, לא עונשי
  }
  if (userCity === org.city) {
    return { points: 20, reason: "קרובה למיקום שלך" };
  }
  if (org.area && userCity && normalizeText(user?.area) === org.area) {
    return { points: 12, reason: "באזור שלך" };
  }
  return { points: 0, reason: null };
}

// עד 35 נקודות. "צרכים נוכחיים" (currentNeeds) הוא אות חזק יותר מ"מקבלת
// באופן כללי" (acceptedCategories) — עמותה שזקוקה *כרגע* בדיוק לקטגוריה של
// השק תדורג מעל עמותה שרק "מקבלת" אותה, גם אם היא קרובה יותר גיאוגרפית.
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

// עד 30 נקודות. preferredCauses = איחוד onboardingCauses + selectedCauses
// (ראו getPreferredCauses ב-recommendationHistory.js) — *לא* הפילטר החי.
function causeScore(org, preferredCauses) {
  if (!preferredCauses || preferredCauses.length === 0) {
    return { points: 0, matched: [] };
  }
  const matched = org.causes.filter((c) => preferredCauses.includes(c));
  return { points: Math.min(30, matched.length * 15), matched };
}

// עד 10 נקודות: עמותה שכבר נבחרה בעבר (+6), עמותה שמקבלת קטגוריה שכבר
// נתרמה בעבר (+4).
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

// עד 5 נקודות: עמותה שהצטרפה למערכת לאחרונה.
function newAssociationBoost(org, now = new Date()) {
  if (!org.joinedAt) return { points: 0 };
  const joined = new Date(org.joinedAt);
  if (Number.isNaN(joined.getTime())) return { points: 0 };
  const daysSince = (now.getTime() - joined.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince <= 30) return { points: 5 };
  if (daysSince <= 90) return { points: 2 };
  return { points: 0 };
}

// זמינות אמיתית: מכבדת override אמיתי של עמותה (orgSettings לפי שם, אותו
// מנגנון ש-OrgProfilePage כבר כותב אליו) ורק כשאין כזה נופלת לברירת המחדל
// שמוגדרת בנתוני הדמו של העמותה עצמה.
export function getIsAssociationAvailable(org, orgSettings) {
  const override = orgSettings?.[org.name];
  if (override && typeof override.isAvailable === "boolean") {
    return override.isAvailable;
  }
  return org.isAvailableDefault;
}

const CAUSE_LABELS_BY_ID = {
  domestic_violence: "נשים נפגעות אלימות במשפחה",
  babies_children: "תינוקות וילדים",
  families_in_need: "משפחות במצוקה",
  holocaust_survivors: "ניצולי שואה",
  soldiers: "חיילים",
  animals: "בעלי חיים",
};

const CATEGORY_LABELS_BY_ID = {
  baby: "התינוקות",
  children: "הילדים",
  teen: "הנוער",
  adult: "המבוגרים",
  elderly: "הקשישים",
};

// מנקדת עמותה בודדת ומחזירה גם רשימת "סיבות" קריאה (עד 3, לפי משקל).
export function scoreAssociation(org, { user, bag, preferredCauses, profile, isAvailable }) {
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
      text: `העמותה זקוקה כרגע בדיוק לבגדי ${CATEGORY_LABELS_BY_ID[cat.meta] || ""} כמו בשק שלך`,
      weight: cat.points,
    });
  } else if (cat.reason === "accepts") {
    candidates.push({
      text: `מקבלת בגדי ${CATEGORY_LABELS_BY_ID[cat.meta] || ""}, כמו בשק שלך`,
      weight: cat.points,
    });
  } else if (cat.reason === "accepts_general") {
    candidates.push({ text: "מקבלת את כל סוגי הבגדים", weight: cat.points });
  }

  if (cause.points > 0) {
    const labels = cause.matched.map((id) => CAUSE_LABELS_BY_ID[id]).filter(Boolean);
    candidates.push({
      text: labels.length > 0 ? `תואמת נושאים שחשובים לך: ${labels.join(", ")}` : "תואמת נושאים שחשובים לך",
      weight: cause.points,
    });
  }

  if (dist.reason) {
    candidates.push({ text: dist.reason, weight: dist.points });
  }

  if (hist.reasons.includes("previously_selected")) {
    candidates.push({ text: "בחרת בעמותה הזו בעבר", weight: 6 });
  }
  if (hist.reasons.includes("donated_category_match")) {
    candidates.push({ text: "תואמת קטגוריות שתרמת בעבר", weight: 4 });
  }

  if (fresh.points > 0) {
    candidates.push({ text: "עמותה חדשה במערכת", weight: fresh.points });
  }

  if (isAvailable) {
    candidates.push({ text: "פתוחה כרגע לתרומות", weight: 1 });
  }

  const reasons = candidates
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map((c) => c.text);

  return { score, reasons, bagCategory };
}

// שלב 1: ניקוד ומיון. מבוסס על onboarding + היסטוריה + השק הנוכחי + זמינות
// בלבד — *לא* מושפע מהפילטר החי של המסך (ראו applyFilters למטה).
export function rankAssociations(associations, { user, bag, profile, orgSettings, now } = {}) {
  const preferredCauses = [
    ...new Set([...(profile?.onboardingCauses || []), ...(profile?.selectedCauses || [])]),
  ];

  return associations
    .map(normalizeAssociation)
    .map((org) => {
      const isAvailable = getIsAssociationAvailable(org, orgSettings);
      const { score, reasons, bagCategory } = scoreAssociation(org, {
        user,
        bag,
        preferredCauses,
        profile: profile || {},
        isAvailable,
      });
      // מקדימים כאן חישוב מרחק/תאריך-הצטרפות גולמיים כדי ש-applyDisplaySort
      // (מיון "קרוב אליי"/"חדש במערכת") לא יצטרך לדעת שום דבר על user/now —
      // רק למיין לפי ערכים שכבר חושבו, בלי לגעת בניקוד עצמו.
      const joinedAtTime = org.joinedAt ? new Date(org.joinedAt).getTime() : null;
      return {
        association: org,
        score,
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

// שלב 2: סינון בלבד — מצמצם רשימה שכבר דורגה, לא נוגע בניקוד/בסדר היחסי.
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

// שלב 3 (רשות): מיון תצוגה חלופי — "קרוב אליי" / "חדש במערכת". גם הוא לא
// נוגע בניקוד או ברשימת ה-reasons של אף עמותה, רק בסדר ההצגה. sortBy
// "recommended" (ברירת המחדל) משאיר את הסדר המדורג-לפי-ניקוד כמות שהוא.
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

export { CAUSE_LABELS_BY_ID, CATEGORY_LABELS_BY_ID };
