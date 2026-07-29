// יומן שליחות תרומה אמיתי — צד לקוח בלבד, לפי userId.
//
// שונה במהותו מה-"גשר" שנפסל בעבר: זה לא מדמה תגובה/גילוי של עמותה, ולא
// יוצר "בקשת תרומה" מזויפת. זו רק רשומה של פעולה אמיתית שכבר קרתה בדפדפן
// הזה — איזו עמותה נבחרה ומתי — כדי שמסך "מסע התרומה" יוכל להציג אותה
// לצד הסטטוס האמיתי (bag.status) שמגיע מהשרת. אם הרשומה חסרה (למשל שק
// שנשלח לפני שהתכונה הזו נוספה) המסע עדיין עובד, רק בלי שם עמותה/תאריך.

const KEY_PREFIX = "rewear_send_log_";

function storageKey(userId) {
  return `${KEY_PREFIX}${userId}`;
}

function readLog(userId) {
  if (userId == null) return {};
  try {
    const saved = localStorage.getItem(storageKey(userId));
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function writeLog(userId, log) {
  if (userId == null) return;
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(log));
  } catch {
    // localStorage לא זמין — לא קריטי, המסע פשוט יוצג בלי הפרטים האלה.
  }
}

// נקראת ברגע ש-createDonationRequest מצליח בפועל (ProfilePage.handleSendToOrg).
export function recordDonationSent(userId, bagId, { associationName, associationId, requestId } = {}) {
  if (userId == null || bagId == null) return;
  const log = readLog(userId);
  log[bagId] = {
    associationName: associationName || null,
    associationId: associationId ?? null,
    requestId: requestId ?? null,
    sentAt: new Date().toISOString(),
  };
  writeLog(userId, log);
}

export function getDonationSendRecord(userId, bagId) {
  if (userId == null || bagId == null) return null;
  const log = readLog(userId);
  return log[bagId] || null;
}
