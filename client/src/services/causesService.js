import API_BASE_URL from "./api";

/**
 * Fetches the full catalog of donation causes.
 * @returns {Promise<Array<{causeId: string, labelHe: string}>>}
 * @throws {string} User-facing error text.
 */
export async function getCauses() {
  const response = await fetch(`${API_BASE_URL}/Causes`);

  if (!response.ok) {
    const errorText = await response.text();
    throw errorText;
  }

  return response.json();
}

/**
 * Replaces the set of causes selected by a user.
 * @param {number} userId
 * @param {string[]} causeIds
 * @throws {string} User-facing error text.
 */
export async function saveUserCauses(userId, causeIds) {
  const response = await fetch(`${API_BASE_URL}/Users/${userId}/causes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ causeIds }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw errorText;
  }
}

/**
 * Reads the cause_ids a user has selected (for later profile editing).
 * @param {number} userId
 * @returns {Promise<string[]>}
 * @throws {string} User-facing error text.
 */
export async function getUserCauses(userId) {
  const response = await fetch(`${API_BASE_URL}/Users/${userId}/causes`);

  if (!response.ok) {
    const errorText = await response.text();
    throw errorText;
  }

  return response.json();
}
