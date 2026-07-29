// היסטוריית העדפות המלצה — צד לקוח בלבד, לפי userId.
//
// שומר *רק* מטא-דאטה של העדפות/היסטוריה של המשתמש עצמו — לא בקשות תרומה
// ולא כל נתון עסקי משותף אחר. זה לא תחליף לנתונים אמיתיים מהשרת; זה קלט
// למנוע ההמלצות ב-associationRecommendation.js בלבד.
//

// onboardingCauses  — נושאים שנבחרו בשלב ה-onboarding מיד אחרי ההרשמה
//                      (RegisterCausesPage). זהו האות האישי הראשוני,
//                      נשמר פעם אחת ומשמש כבסיס להמלצות מהשנייה הראשונה.
// selectedCauses    — נושאים שנעשה בהם שימוש בפועל (פילטר פעיל בזמן
//                      שנבחרה/נשלחה עמותה) — אות "למידה" נוסף למשתמשים
//                      חוזרים, מצטבר לאורך זמן.
// selectedAssociationIds — עמותות שנבחרו בעבר בפועל (נשלחה אליהן תרומה).
// donatedCategories — קטגוריות בגדים שנתרמו בפועל (מהשקים שהועלו).
// lastFilters       — תצורת הסינון/מיון האחרונה שנעשה בה שימוש — נשמרת
//                      לנוחות המשתמש (למלא מראש את הפילטרים בפעם הבאה)
//                      ואינה נקראת ע"י מנוע הניקוד עצמו.

const KEY_PREFIX = "rewear_reco_";
const MAX_LIST_LENGTH = 20;

function storageKey(userId) {
  return `${KEY_PREFIX}${userId}`;
}

const DEFAULT_PROFILE = {
  onboardingCauses: [],
  selectedCauses: [],
  selectedAssociationIds: [],
  donatedCategories: [],
  lastFilters: {
    causes: [],
    category: null,
    availableOnly: false,
    sortBy: "recommended",
  },
};

export function getRecoProfile(userId) {
  if (userId == null) return { ...DEFAULT_PROFILE };
  try {
    const saved = localStorage.getItem(storageKey(userId));
    if (!saved) return { ...DEFAULT_PROFILE };
    const parsed = JSON.parse(saved);
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      lastFilters: { ...DEFAULT_PROFILE.lastFilters, ...(parsed.lastFilters || {}) },
    };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

function saveRecoProfile(userId, profile) {
  if (userId == null) return;
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(profile));
  } catch {
    // localStorage לא זמין (מצב פרטי וכד') — לא קריטי, ממשיכים בלי לשמור.
  }
}

function dedupCapped(list, maxLength = MAX_LIST_LENGTH) {
  return [...new Set(list)].slice(-maxLength);
}

// סינון בסיסי בלבד — הרשימה התקפה כיום מגיעה מ-GET /api/Causes (מקור
// אמת יחיד), לא ממערך קשיח בצד לקוח, אז אין כאן יותר whitelist מקומי.
function sanitizeCauseIds(ids) {
  if (!Array.isArray(ids)) return [];
  return ids.filter((id) => typeof id === "string" && id.length > 0);
}

// נקראת פעם אחת ב-RegisterCausesPage (שלב ה-onboarding, מיד אחרי ההרשמה).
export function saveOnboardingCauses(userId, causeIds) {
  const profile = getRecoProfile(userId);
  profile.onboardingCauses = dedupCapped(sanitizeCauseIds(causeIds));
  saveRecoProfile(userId, profile);
}

// נקראת כשהמשתמש בפועל שולח תרומה לעמותה — גם רושמת את העמותה שנבחרה,
// וגם "מלמדת" את מנוע ההמלצות מהנושאים שהיו מסוננים בפועל בסשן הנוכחי
// (activeCauseFilters — ראו ProfilePage.jsx: נקרא מ-lastFilters.causes,
// שמשתקף שם באופן חי מפילטר הנושאים הפעיל ב-AssociationRecommendationList,
// לא מ-onboardingCauses).
export function recordAssociationSelected(userId, associationId, activeCauseFilters = []) {
  const profile = getRecoProfile(userId);
  profile.selectedAssociationIds = dedupCapped([...profile.selectedAssociationIds, associationId]);
  const validFilters = sanitizeCauseIds(activeCauseFilters);
  if (validFilters.length > 0) {
    profile.selectedCauses = dedupCapped([...profile.selectedCauses, ...validFilters]);
  }
  saveRecoProfile(userId, profile);
}

// נקראת כשמשתמש מעלה שק תרומה בפועל.
export function recordDonatedCategory(userId, category) {
  if (!category) return;
  const profile = getRecoProfile(userId);
  profile.donatedCategories = dedupCapped([...profile.donatedCategories, category]);
  saveRecoProfile(userId, profile);
}

// שמירת תצורת הפילטר/מיון האחרונה — לנוחות תצוגה בלבד, לא נקרא ע"י הניקוד.
export function saveLastFilters(userId, filters) {
  const profile = getRecoProfile(userId);
  profile.lastFilters = { ...profile.lastFilters, ...filters };
  saveRecoProfile(userId, profile);
}

// האיחוד של onboardingCauses + selectedCauses — זהו קלט "הנושאים המועדפים"
// היחיד שמוזן לניקוד (scoreAssociation). לא כולל את הפילטר החי של המסך.
export function getPreferredCauses(profile) {
  return dedupCapped([...(profile.onboardingCauses || []), ...(profile.selectedCauses || [])]);
}
