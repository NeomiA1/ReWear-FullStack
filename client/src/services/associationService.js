import API_BASE_URL from "./api";

/**
 * Fetches every association as AssociationListItemDto rows (id, name,
 * email, city, area, deliveryMode, isAvailableDefault, joinedAt, types,
 * latitude, longitude, causes, acceptedCategories, currentNeeds).
 *
 * @returns {Promise<object[]>}
 * @throws {string} user-facing error message
 */
export async function getAllAssociations() {
  const response = await fetch(`${API_BASE_URL}/Associations`);

  if (!response.ok) {
    const errorText = await response.text();
    throw errorText;
  }

  return response.json();
}

/**
 * Registers a new organization in one server round-trip.
 * The server creates both a Users row and an Associations row
 * inside a single transaction and returns the created user object.
 *
 * @param {object} data
 * @param {string} data.fullName        - contact person name
 * @param {string} data.email           - login email (also used as username)
 * @param {string} data.password        - plain text password
 * @param {string} [data.phone]         - optional
 * @param {string} [data.city]          - optional
 * @param {string} data.associationName - org display name
 * @param {string} [data.orgNumber]     - legal registration number (ח"פ)
 * @param {string} data.address         - street address
 * @param {string} data.workMode        - 'SecondHandStores' | 'OwnStore' | 'PhysicalOnly'
 * @param {string} data.deliveryMode    - 'Pickup' | 'SelfArrival' | 'Both'
 * @param {string[]} [data.causeIds]    - optional cause_id keys (Causes catalog)
 *
 * @returns {Promise<object>} The created user object:
 *   { userId, fullName, username, email, phone, city,
 *     registrationMethod, userType }
 *
 * @throws {string} User-facing error message (Hebrew). Always a string,
 *   never a raw SQL exception or JSON blob.
 */
export async function registerOrganization(data) {
  const response = await fetch(`${API_BASE_URL}/Associations/register`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(data),
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
     
    }

    throw userFacingMessage;
  }

  return response.json();
}

/**
 * Looks up a real Association by exact name + email match.
 *
 * NOTE: this is the only association "lookup" endpoint the server exposes
 * today — there is no list/search endpoint (e.g. GET /api/associations),
 * so the client cannot browse real organizations from the database.
 * TODO(server): add a GET /api/associations (with optional city/area
 * filters) so donors can pick from real, live organizations instead of
 * this exact-match check against a name the client already guessed.
 *
 * @param {string} name  - Association's exact display name
 * @param {string} email - Association's exact registered email
 * @returns {Promise<object|null>} the Association object (with a real
 *   `associationId` and `isAvailable`) if found, or null if no match.
 * @throws {string} on any error other than "not found"
 */
export async function checkAssociationExists(name, email) {
  const params = new URLSearchParams({ name, email });
  const response = await fetch(`${API_BASE_URL}/Associations/check?${params.toString()}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw errorText;
  }

  return response.json();
}

/**
 * Updates an Association's availability-to-receive-donations flag.
 *
 * @param {number} associationId - real Association PK (from checkAssociationExists)
 * @param {boolean} isAvailable
 * @throws {string} user-facing error message
 */
export async function updateAssociationAvailability(associationId, isAvailable) {
  const response = await fetch(
    `${API_BASE_URL}/Associations/${associationId}/availability`,
    {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(isAvailable),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw errorText;
  }

  return response.text();
}