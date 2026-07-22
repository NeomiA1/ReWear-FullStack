import API_BASE_URL from "./api";

/**
 * Creates a Store record on the server.
 *
 * NOTE: unlike /api/associations/register, this endpoint only creates a
 * standalone Store row — the SecondHandStores table has no password/login
 * column, so this does NOT create a Users row or any login credentials.
 * TODO(server): add a combined register endpoint (Users + SecondHandStores,
 * the way /api/associations/register does for orgs) so a shop can log back
 * in with its own account. Until then the client keeps the shop session
 * local-only after registering (see RegisterShopPage.jsx).
 *
 * @param {object} data
 * @param {string} data.storeName
 * @param {string} data.address
 * @param {string} data.email
 * @param {string} [data.city]
 * @param {string} [data.area]
 * @param {string} [data.phone]
 * @param {string} [data.description]
 *
 * @returns {Promise<string>} success message text
 * @throws {string} user-facing error message
 */
export async function registerStore(data) {
  const response = await fetch(`${API_BASE_URL}/Stores`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const text = await response.text();

  if (!response.ok) {
    let userFacingMessage = text;

    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        userFacingMessage = parsed.join("\n");
      }
    } catch {
      // not JSON — use raw text as-is
    }

    throw userFacingMessage;
  }

  return text;
}

/**
 * Real stores near a given association (real DB data, not the client's
 * hardcoded demo list).
 *
 * @param {number} associationId - real Association PK (from checkAssociationExists)
 * @returns {Promise<Array<{storeId, storeName, address, city, area, email, phone, description, createdAt}>>}
 * @throws {string} user-facing error message
 */
export async function getNearbyStores(associationId) {
  const response = await fetch(`${API_BASE_URL}/Stores/nearby/${associationId}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw errorText;
  }

  return response.json();
}
