// עוזרי תצוגה בלבד לשקי תרומה — לא נוגעים ב-bagId האמיתי ולא בשרת.
// כל הפונקציות כאן משתמשות בשדות שכבר קיימים על השק (targetAges/age,
// targetGender/gender) או שומרות רק "מטא-דאטה" קטנה לצורכי תצוגה (תאריך
// יצירה מקומי), לעולם לא ממציאות זהות חדשה לשק.

const CREATED_AT_KEY_PREFIX = "rewear_bag_local_created_at_";

function createdAtStorageKey(userId) {
  return `${CREATED_AT_KEY_PREFIX}${userId}`;
}

function readCreatedAtMap(userId) {
  if (userId == null) return {};
  try {
    const saved = localStorage.getItem(createdAtStorageKey(userId));
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function writeCreatedAtMap(userId, map) {
  if (userId == null) return;
  try {
    localStorage.setItem(createdAtStorageKey(userId), JSON.stringify(map));
  } catch {
    // localStorage לא זמין — לא קריטי, זו תצוגה בלבד.
  }
}

/**
 * מחזירה את תאריך/שעת היצירה "המקומיים" של שק, לצורכי תצוגה בלבד.
 *
 * נוצרת בפעם הראשונה שה-bagId הזה נראה בדפדפן הזה (בפועל — מיד אחרי
 * העלאה, כשהעמוד טוען את רשימת השקים מהשרת מחדש), ונשמרת ב-localStorage
 * כדי שרענון הדף לא ישנה אותה. שק קיים מהעבר שנטען לראשונה אחרי הפריסה
 * הזו יקבל את הרגע שבו הוא *נצפה* לראשונה כ"תאריך יצירה מקומי" — זה
 * ידוע וסביר להדגמה, ולא מתחזה לתאריך היצירה האמיתי בשרת.
 *
 * @param {number|string|null|undefined} userId
 * @param {number|string|null|undefined} bagId - ה-bagId האמיתי מהשרת
 * @returns {string} ISO string (new Date().toISOString())
 */
export function getOrCreateLocalCreatedAt(userId, bagId) {
  if (userId == null || bagId == null) {
    return new Date().toISOString();
  }

  const map = readCreatedAtMap(userId);

  if (map[bagId]) {
    return map[bagId];
  }

  const createdAt = new Date().toISOString();
  map[bagId] = createdAt;
  writeCreatedAtMap(userId, map);
  return createdAt;
}

/**
 * מציגה ISO string בפורמט ישראלי קצר: DD.MM.YYYY | HH:MM (24 שעות),
 * לפי הזמן המקומי בדפדפן.
 *
 * @param {string} isoString
 * @returns {string}
 */
export function formatLocalCreatedAt(isoString) {
  if (!isoString) return "";

  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "";

  const pad = (n) => String(n).padStart(2, "0");

  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());

  return `${day}.${month}.${year} | ${hours}:${minutes}`;
}

/**
 * שם תצוגה קצר וטבעי לשק, על בסיס פרטים שהמשתמש הזין בפועל בעת ההעלאה
 * (קהל היעד לפי גיל, ואם אין — לפי מגדר). לא ממציא מידע חדש ולא שומר
 * שום דבר — תמיד מחושב מחדש מהשדות האמיתיים של השק.
 *
 * מקבל גם שק "גולמי" מהשרת (targetAges/targetGender) וגם שק ש-ProfilePage
 * כבר מיפה לשדות age/gender, כך שאפשר להשתמש בו בשני המקומות בלי המרה.
 *
 * @param {{age?: string, targetAges?: string, gender?: string, targetGender?: string}} bag
 * @returns {string}
 */
export function getBagDisplayName(bag) {
  const age = bag?.age || bag?.targetAges || "";
  const gender = bag?.gender || bag?.targetGender || "";

  if (age) return `שק בגדי ${age}`;
  if (gender) return `שק בגדי ${gender}`;
  return "שק תרומה";
}
