// מקור נתונים יחיד לעמותות (דמו, צד לקוח בלבד) — TODO(server): להחליף ב-
// GET /api/associations האמיתי כשיהיה קיים בשרת (ראו TODO(server) המקביל
// ב-associationService.js). עד אז זהו המקור היחיד שכל מסכי ההמלצה
// (ProfilePage/MapPage) קוראים ממנו, כדי שלא יהיו יותר מערכים כפולים.

// שישה נושאי תרומה — משמשים גם בבחירת עדיפויות בהרשמה וגם בפילטר הנושאים.
export const CAUSES = [
  { id: "domestic_violence",   label: "נשים נפגעות אלימות במשפחה" },
  { id: "babies_children",     label: "תינוקות וילדים" },
  { id: "families_in_need",    label: "משפחות במצוקה" },
  { id: "holocaust_survivors", label: "ניצולי שואה" },
  { id: "soldiers",            label: "חיילים" },
  { id: "animals",             label: "בעלי חיים" },
];

// קטגוריות בגדים — נגזרות מאותם ערכי "גיל" שכבר קיימים ב-UploadDonationPage.
export const CATEGORIES = [
  { id: "baby",     label: "בגדי תינוקות" },
  { id: "children", label: "בגדי ילדים" },
  { id: "teen",     label: "בגדי נוער" },
  { id: "adult",    label: "בגדי מבוגרים" },
  { id: "elderly",  label: "בגדים לקשישים" },
];

// כל עמותה:
//   id, name, email (לצורך checkAssociationExists), city, area,
//   latitude/longitude (undefined — אין geocoding אמיתי, ה-scorer נופל
//   חזרה לעיר/אזור), causes[], acceptedCategories[] ("general" = מקבלת
//   הכל), currentNeeds[] (תת-קבוצה של acceptedCategories — הקטגוריות
//   שהעמותה זקוקה להן *כרגע*, אות חזק יותר מ"מקבלת באופן כללי"),
//   joinedAt (ISO), isAvailableDefault (ברירת מחדל כשאין override אמיתי —
//   ראו getIsAssociationAvailable ב-associationRecommendation.js).
export const ASSOCIATIONS = [
  {
    id: 1,
    name: "ויצו",
    email: "vizo@example-demo.org",
    city: "תל אביב",
    area: "מרכז",
    latitude: null,
    longitude: null,
    causes: ["domestic_violence", "families_in_need"],
    acceptedCategories: ["adult", "children"],
    currentNeeds: ["children"],
    types: "בגדי נשים, ילדים",
    deliveryMode: "Both",
    joinedAt: "2022-03-01",
    isAvailableDefault: true,
  },
  {
    id: 2,
    name: "נעמת",
    email: "naamat@example-demo.org",
    city: "חיפה",
    area: "צפון",
    latitude: null,
    longitude: null,
    causes: ["domestic_violence", "babies_children"],
    acceptedCategories: ["baby", "children", "adult"],
    currentNeeds: ["baby"],
    types: "כל סוגי הבגדים",
    deliveryMode: "Both",
    joinedAt: "2021-05-10",
    isAvailableDefault: true,
  },
  {
    id: 3,
    name: "לתת",
    email: "latet@example-demo.org",
    city: "ירושלים",
    area: "ירושלים",
    latitude: null,
    longitude: null,
    causes: ["families_in_need", "holocaust_survivors"],
    acceptedCategories: ["adult", "elderly", "teen"],
    currentNeeds: ["elderly"],
    types: "בגדי חורף, מעילים",
    deliveryMode: "SelfArrival",
    joinedAt: "2020-01-15",
    // בכוונה לא-זמינה כברירת מחדל — כדי שיהיה אפשר לבדוק בפועל את מיון
    // הזמינות ואת פילטר "זמינות בלבד".
    isAvailableDefault: false,
  },
  {
    id: 4,
    name: "יד שרה",
    email: "yadsarah@example-demo.org",
    city: "באר שבע",
    area: "דרום",
    latitude: null,
    longitude: null,
    causes: ["holocaust_survivors"],
    acceptedCategories: ["elderly", "adult"],
    currentNeeds: ["elderly"],
    types: "בגדים לקשישים",
    deliveryMode: "Pickup",
    joinedAt: "2019-11-01",
    isAvailableDefault: true,
  },
  {
    id: 5,
    name: "קרן חיים",
    email: "keren@example-demo.org",
    city: "רמת גן",
    area: "מרכז",
    latitude: null,
    longitude: null,
    causes: ["babies_children", "families_in_need"],
    acceptedCategories: ["baby", "children"],
    currentNeeds: ["baby", "children"],
    types: "בגדי ילדים",
    deliveryMode: "Both",
    // עמותה "טרייה" בכוונה — לבדיקת בוסט "עמותה חדשה".
    joinedAt: "2026-07-20",
    isAvailableDefault: true,
  },
  {
    id: 6,
    name: "אגודת חיילי מילואים",
    email: "miluim@example-demo.org",
    city: "אשדוד",
    area: "דרום",
    latitude: null,
    longitude: null,
    causes: ["soldiers"],
    acceptedCategories: ["adult", "teen"],
    currentNeeds: ["adult"],
    types: "בגדי חיילים ואזרחיים למילואימניקים",
    deliveryMode: "SelfArrival",
    joinedAt: "2023-06-01",
    isAvailableDefault: true,
  },
  {
    id: 7,
    name: "תנו לחיות לחיות",
    email: "animals@example-demo.org",
    city: "נתניה",
    area: "מרכז",
    latitude: null,
    longitude: null,
    causes: ["animals"],
    acceptedCategories: ["general"],
    currentNeeds: [],
    types: "בדים ומצעים לשימוש בעלי חיים",
    deliveryMode: "Pickup",
    joinedAt: "2024-02-14",
    isAvailableDefault: true,
  },
];
