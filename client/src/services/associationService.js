
import API_BASE_URL from "./api";

/**
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
 * @throws {string} Server error message string if the request fails.
 *   Matches the pattern in userService.js so RegisterOrgPage
 *   can handle errors the same way.
 */
export async function registerOrganization(data) {
  const response = await fetch(`${API_BASE_URL}/Associations/register`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw errorText;
  }

  return response.json();
}