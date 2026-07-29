import API_BASE_URL from "./api";

/**
 * Fetches the full Causes catalog: [{ causeId, labelHe }, ...]
 * (property names as serialized from server/BL/Cause.cs).
 *
 * @returns {Promise<{causeId: string, labelHe: string}[]>}
 * @throws {string} user-facing error message
 */
export async function getAllCauses() {
  const response = await fetch(`${API_BASE_URL}/Causes`);

  if (!response.ok) {
    const errorText = await response.text();
    throw errorText;
  }

  return response.json();
}

/**
 * Fetches the cause_id keys a user previously selected.
 *
 * @param {number} userId
 * @returns {Promise<string[]>}
 * @throws {string} user-facing error message
 */
export async function getUserCauses(userId) {
  const response = await fetch(`${API_BASE_URL}/Causes/user/${userId}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw errorText;
  }

  return response.json();
}

/**
 * Replaces a user's saved cause_id selections.
 *
 * @param {number} userId
 * @param {string[]} causeIds
 * @throws {string} user-facing error message
 */
export async function saveUserCauses(userId, causeIds) {
  const response = await fetch(`${API_BASE_URL}/Causes/user/${userId}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(causeIds || []),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw errorText;
  }

  return response.text();
}
