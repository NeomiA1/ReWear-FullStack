

const KEY_PREFIX = "rewear_reco_";
const MAX_LIST_LENGTH = 20;

function storageKey(userId) {
  return `${KEY_PREFIX}${userId}`;
}

const DEFAULT_PROFILE = {
  onboardingCauses: [],
  selectedCauses: [],
  selectedAssociationIds: [],
  donatedCategories: [],
  lastFilters: {
    causes: [],
    category: null,
    availableOnly: false,
    sortBy: "recommended",
  },
};

export function getRecoProfile(userId) {
  if (userId == null) return { ...DEFAULT_PROFILE };
  try {
    const saved = localStorage.getItem(storageKey(userId));
    if (!saved) return { ...DEFAULT_PROFILE };
    const parsed = JSON.parse(saved);
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      lastFilters: { ...DEFAULT_PROFILE.lastFilters, ...(parsed.lastFilters || {}) },
    };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

function saveRecoProfile(userId, profile) {
  if (userId == null) return;
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(profile));
  } catch {
  
  }
}

function dedupCapped(list, maxLength = MAX_LIST_LENGTH) {
  return [...new Set(list)].slice(-maxLength);
}

function sanitizeCauseIds(ids) {
  if (!Array.isArray(ids)) return [];
  return ids.filter((id) => typeof id === "string" && id.length > 0);
}

export function saveOnboardingCauses(userId, causeIds) {
  const profile = getRecoProfile(userId);
  profile.onboardingCauses = dedupCapped(sanitizeCauseIds(causeIds));
  saveRecoProfile(userId, profile);
}

export function recordAssociationSelected(userId, associationId, activeCauseFilters = []) {
  const profile = getRecoProfile(userId);
  profile.selectedAssociationIds = dedupCapped([...profile.selectedAssociationIds, associationId]);
  const validFilters = sanitizeCauseIds(activeCauseFilters);
  if (validFilters.length > 0) {
    profile.selectedCauses = dedupCapped([...profile.selectedCauses, ...validFilters]);
  }
  saveRecoProfile(userId, profile);
}

export function recordDonatedCategory(userId, category) {
  if (!category) return;
  const profile = getRecoProfile(userId);
  profile.donatedCategories = dedupCapped([...profile.donatedCategories, category]);
  saveRecoProfile(userId, profile);
}

export function saveLastFilters(userId, filters) {
  const profile = getRecoProfile(userId);
  profile.lastFilters = { ...profile.lastFilters, ...filters };
  saveRecoProfile(userId, profile);
}

export function getPreferredCauses(profile) {
  return dedupCapped([...(profile.onboardingCauses || []), ...(profile.selectedCauses || [])]);
}
