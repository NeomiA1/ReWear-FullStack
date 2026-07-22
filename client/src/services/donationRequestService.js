import API_BASE_URL from "./api";

export async function createDonationRequest(request) {
  const response = await fetch(`${API_BASE_URL}/DonationRequests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw errorText;
  }

  return await response.json();
}

export async function linkBagToDonationRequest(requestId, bagId) {
  const response = await fetch(
    `${API_BASE_URL}/DonationRequests/${requestId}/bags/${bagId}`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw errorText;
  }

  return await response.text();
}

/**
 * Org responds (approve/reject) to a real donation request.
 *
 * @param {number} requestId
 * @param {string} newStatus - e.g. "Accepted" | "Rejected"
 * @param {string|null} [associationResponse] - optional free-text note
 * @returns {Promise<string>} success message text
 * @throws {string} user-facing error message
 */
export async function respondToDonationRequest(requestId, newStatus, associationResponse = null) {
  const response = await fetch(
    `${API_BASE_URL}/DonationRequests/${requestId}/response`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newStatus, associationResponse }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw errorText;
  }

  return await response.text();
}