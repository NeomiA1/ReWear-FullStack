
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

export const COLLAB_STATUS_LABELS = {
  pending:  { label: "ממתין לאישור", color: "bg-amber-50 text-amber-500" },
  approved: { label: "פעיל ✓",       color: "bg-green-50 text-green-600" },
  rejected: { label: "נדחה",         color: "bg-red-50 text-red-400"     },
};

export function getCollabStatusInfo(status) {
  return COLLAB_STATUS_LABELS[status] || COLLAB_STATUS_LABELS.pending;
}

export const BAG_STATUS_LABELS = {
  Draft:                 { label: "טיוטה",              color: "bg-gray-100 text-gray-500"    },
  Published:             { label: "פורסם",              color: "bg-blue-50 text-blue-500"     },
  WaitingForAssociation: { label: "ממתין לתגובת עמותה",  color: "bg-amber-50 text-amber-500"   },
  Accepted:              { label: "אושר ✓",              color: "bg-green-50 text-green-600"   },
  Rejected:              { label: "נדחה",                color: "bg-red-50 text-red-400"       },
  PickupScheduled:       { label: "תואם איסוף",          color: "bg-green-50 text-green-600"   },
  Completed:             { label: "הושלם ✓",             color: "bg-green-50 text-green-600"   },
};

export function getBagStatusInfo(status) {
  return BAG_STATUS_LABELS[status] || BAG_STATUS_LABELS.Draft;
}

export const INVENTORY_STATUS_LABELS = {
  pending: { label: "טרם סומן",     color: "bg-amber-50 text-amber-500" },
  inShop:  { label: "נשאר בחנות ✓", color: "bg-green-50 text-green-600" },
  toOrg:   { label: "עבר לעמותה ✓", color: "bg-blue-50 text-blue-500"   },
};

export function getInventoryStatusInfo(status) {
  return INVENTORY_STATUS_LABELS[status] || INVENTORY_STATUS_LABELS.pending;
}
