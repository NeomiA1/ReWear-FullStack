

const LOCATION_EXACT_CITY = 70;
const LOCATION_SAME_AREA   = 40;
const LOCATION_BASELINE    = 15;

const DELIVERY_BOTH   = 30;
const DELIVERY_SINGLE = 20;

function normalize(value) {
  return (value ?? "").toString().trim().replace(/\s+/g, " ");
}

function locationScore(userCity, org) {
  const u    = normalize(userCity);
  const city = normalize(org?.city);
  const area = normalize(org?.area);

  if (u && city && u === city) {
    return { points: LOCATION_EXACT_CITY, reason: "אותה עיר" };
  }
  if (u && area && u === area) {
    return { points: LOCATION_SAME_AREA, reason: "אותו אזור" };
  }
  return { points: LOCATION_BASELINE, reason: null };
}

function deliveryScore(org) {
  const mode = normalize(org?.deliveryMode);

  if (mode === "Both")        return { points: DELIVERY_BOTH,   reason: "קליטה גמישה"  };
  if (mode === "Pickup")      return { points: DELIVERY_SINGLE, reason: "איסוף מהבית"   };
  if (mode === "SelfArrival") return { points: DELIVERY_SINGLE, reason: "הגעה לעמותה"   };
  return { points: 0, reason: null };
}

export function scoreAssociation(bag, org, user) {
  const loc = locationScore(user?.city, org);
  const del = deliveryScore(org);

  const score   = Math.round(loc.points + del.points);
  const reasons = [loc.reason, del.reason].filter(Boolean);

  return { score, reasons };
}
