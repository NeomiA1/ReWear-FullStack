import API_BASE_URL from "./api";

/**
 * Registers a new store in one server round-trip.
 * The server creates both a Users row (user_type = 'Store') and a
 * SecondHandStores row inside a single transaction and returns the
 * created user object — the same pattern registerOrganization() uses
 * for associations (see associationService.js).
 *
 * @param {object} data
 * @param {string} data.fullName   - contact person name
 * @param {string} data.email      - login email (also used as username)
 * @param {string} data.password   - plain text password
 * @param {string} [data.phone]    - optional
 * @param {string} [data.city]     - optional
 * @param {string} data.storeName  - shop display name
 * @param {string} data.address    - street address
 * @param {string} [data.area]     - optional
 * @param {string} [data.description] - optional
 *
 * @returns {Promise<object>} The created user object:
 *   { userId, fullName, username, email, phone, city,
 *     registrationMethod, userType }
 *
 * @throws {string} User-facing error message (Hebrew). Always a string,
 *   never a raw SQL exception or JSON blob.
 */
export async function registerStore(data) {
  const response = await fetch(`${API_BASE_URL}/Stores/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();

    let userFacingMessage = errorText;

    try {
      const parsed = JSON.parse(errorText);
      if (Array.isArray(parsed) && parsed.length > 0) {
        userFacingMessage = parsed.join("\n");
      }
    } catch {
      // not JSON — use raw text as-is
    }

    throw userFacingMessage;
  }

  return response.json();
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
