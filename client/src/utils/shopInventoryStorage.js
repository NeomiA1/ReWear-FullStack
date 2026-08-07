// מוצא מ-ShopInventoryPage.jsx כדי שדפים נוספים (כמו ShopHomePage) יוכלו
// לקרוא את אותו מלאי אמיתי במקום להציג מספר קבוע ולא קשור.

const STORAGE_KEY = "rewear_shop_inventory";

// שומר מפה { [זהות חנות]: items[] } — אותו דפוס בדיוק כמו orgSettings ב-
// UserContext.jsx — כדי שסימון פריטים ישרוד רענון, ולא "יידלף" בין חנויות
// שונות שמתחברות באותו דפדפן. חנות חדשה שטרם קיבלה פריטים מתחילה ריקה —
// אין נתוני דמה כברירת מחדל (ראו תיקון: חנויות אמיתיות הציגו בטעות מלאי דמה).
export function loadInventoryFor(shopKey) {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return all[shopKey] || [];
  } catch {
    return [];
  }
}

export function saveInventoryFor(shopKey, items) {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    all[shopKey] = items;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // localStorage לא זמין — נכשל בשקט, המצב נשאר בזיכרון בלבד לסשן הזה
  }
}
