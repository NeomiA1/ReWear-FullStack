// מוצא מ-ShopInventoryPage.jsx כדי שדפים נוספים (כמו ShopHomePage) יוכלו
// לקרוא את אותו מלאי אמיתי במקום להציג מספר קבוע ולא קשור.

// נתוני דמה – בעתיד יגיעו מהשרת
export const INITIAL_ITEMS = [
  { id: 1, title: "3 שקיות – בגדי נשים",       org: "עמותת לב חם", condition: "מצב טוב",  status: "inShop"    },
  { id: 2, title: "שק – נעלי ילדים",            org: "ידיים לעתיד", condition: "כמו חדש",  status: "inShop"    },
  { id: 3, title: "2 שקיות – מעילים לגברים",   org: "עמותת לב חם", condition: "מצב סביר", status: "toOrg"     },
  { id: 4, title: "שק – בגדי ילדים מעורב",      org: "נשים בקהילה", condition: "מצב טוב",  status: "inShop"    },
  { id: 5, title: "שק – בגדי נשים מעורב",       org: "עמותת לב חם", condition: "תקין",     status: "pending"   },
];

const STORAGE_KEY = "rewear_shop_inventory";

// שומר מפה { [זהות חנות]: items[] } — אותו דפוס בדיוק כמו orgSettings ב-
// UserContext.jsx — כדי שסימון פריטים ישרוד רענון, ולא "יידלף" בין חנויות
// שונות שמתחברות באותו דפדפן.
export function loadInventoryFor(shopKey) {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return all[shopKey] || INITIAL_ITEMS;
  } catch {
    return INITIAL_ITEMS;
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
