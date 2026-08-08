import API_BASE_URL from "./api";

function getAuthHeaders() {
  const savedUser = JSON.parse(
    localStorage.getItem("rewear_user") || "null"
  );

  const token = savedUser?.token;

  return {
    "Content-Type": "application/json",
    ...(token && {
      Authorization: `Bearer ${token}`
    })
  };
}

export async function createDonationRequest(request) {
  const response = await fetch(
    `${API_BASE_URL}/DonationRequests/submit`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(request)
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw errorText;
  }

  return await response.json();
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
export async function respondToDonationRequest(
  requestId,
  newStatus,
  associationResponse = null
) {
  const response = await fetch(
    `${API_BASE_URL}/DonationRequests/${requestId}/response`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        newStatus,
        associationResponse
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw errorText;
  }

  return await response.text();
}