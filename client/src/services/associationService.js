import API_BASE_URL from "./api";

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