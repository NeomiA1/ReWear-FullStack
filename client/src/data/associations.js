// קטגוריות בגדים — נגזרות מאותם ערכי "גיל" שכבר קיימים ב-UploadDonationPage.
// משמש לפילטר הקטגוריה ב-AssociationRecommendationList, לצד רשימת העמותות
// האמיתית (getAllAssociations ב-associationService.js).
export const CATEGORIES = [
  { id: "baby",     label: "בגדי תינוקות" },
  { id: "children", label: "בגדי ילדים" },
  { id: "teen",     label: "בגדי נוער" },
  { id: "adult",    label: "בגדי מבוגרים" },
  { id: "elderly",  label: "בגדים לקשישים" },
];
