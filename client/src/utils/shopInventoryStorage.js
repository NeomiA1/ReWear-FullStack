

const STORAGE_KEY = "rewear_shop_inventory";

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
  
  }
}
