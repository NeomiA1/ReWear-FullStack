// מיפוי סטטוסים מרוכז — מקור אמת יחיד לתוויות/צבעים של סטטוסים בכל
// האפליקציה. לפני זה כל מסך הגדיר עותק משלו, ולפעמים באותו סטטוס בדיוק
// (למשל "approved") היה צבע שונה במסך אחד לעומת השני.

// ── תרומה (מחזור חיים מקומי): pending → approved → scheduled → collected/rejected ──
export const DONATION_STATUS_LABELS = {
  pending:   { label: "ממתין לאישור", color: "bg-amber-50 text-amber-500" },
  approved:  { label: "אושרה",        color: "bg-blue-50 text-blue-500"   },
  scheduled: { label: "תואם איסוף",   color: "bg-green-50 text-green-600" },
  collected: { label: "נאסף",         color: "bg-gray-100 text-gray-400"  },
  rejected:  { label: "נדחה",         color: "bg-red-50 text-red-400"     },
};

export function getDonationStatusInfo(status) {
  return DONATION_STATUS_LABELS[status] || DONATION_STATUS_LABELS.pending;
}

// ── שיתוף פעולה עמותה↔חנות: pending → approved / rejected ─────────────────
export const COLLAB_STATUS_LABELS = {
  pending:  { label: "ממתין לאישור", color: "bg-amber-50 text-amber-500" },
  approved: { label: "פעיל ✓",       color: "bg-green-50 text-green-600" },
  rejected: { label: "נדחה",         color: "bg-red-50 text-red-400"     },
};

export function getCollabStatusInfo(status) {
  return COLLAB_STATUS_LABELS[status] || COLLAB_STATUS_LABELS.pending;
}

// ── שק תרומה אמיתי (מהשרת): Draft/Published/WaitingForAssociation/... ─────
export const BAG_STATUS_LABELS = {
  Draft:                 { label: "טיוטה",              color: "bg-gray-100 text-gray-500"    },
  Published:             { label: "פורסם",              color: "bg-blue-50 text-blue-500"     },
  WaitingForAssociation: { label: "ממתין לתגובת עמותה",  color: "bg-amber-50 text-amber-500"   },
  Accepted:              { label: "אושר ✓",              color: "bg-green-50 text-green-600"   },
  Rejected:              { label: "נדחה",                color: "bg-red-50 text-red-400"       },
  PickupScheduled:       { label: "תואם איסוף",          color: "bg-purple-50 text-purple-500" },
  Completed:             { label: "הושלם ✓",             color: "bg-green-50 text-green-600"   },
};

export function getBagStatusInfo(status) {
  return BAG_STATUS_LABELS[status] || BAG_STATUS_LABELS.Draft;
}

// ── פריט במלאי חנות: pending / inShop / toOrg ─────────────────────────────
export const INVENTORY_STATUS_LABELS = {
  pending: { label: "טרם סומן",     color: "bg-amber-50 text-amber-500" },
  inShop:  { label: "נשאר בחנות ✓", color: "bg-green-50 text-green-600" },
  toOrg:   { label: "עבר לעמותה ✓", color: "bg-blue-50 text-blue-500"   },
};

export function getInventoryStatusInfo(status) {
  return INVENTORY_STATUS_LABELS[status] || INVENTORY_STATUS_LABELS.pending;
}
