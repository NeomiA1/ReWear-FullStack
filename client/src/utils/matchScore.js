// Smart Matching V1 — rule-based association scoring.
// Frontend-only, pure functions. No backend, no DB, no geocoding.
//
// V1 scores on two reliable, structured signals:
//   1. Location (0–70): user city vs association city/area
//   2. Delivery (0–30): association deliveryMode flexibility
//
// Content matching (clothing category / size / audience) is DEFERRED —
// the schema has no structured association preference fields yet.
// The `bag` parameter is kept in the signature so the future content
// phase can plug in without changing any caller.

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

// Public: score one association for the selected bag + user.
// Returns { score: 0–100 integer, reasons: string[] }.
// Never throws, never NaN, never negative.
export function scoreAssociation(bag, org, user) {
  const loc = locationScore(user?.city, org);
  const del = deliveryScore(org);

  const score   = Math.round(loc.points + del.points);
  const reasons = [loc.reason, del.reason].filter(Boolean);

  return { score, reasons };
}
