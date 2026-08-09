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
  associationResponse = null,
  collectionMode = null
) {
  const response = await fetch(
    `${API_BASE_URL}/DonationRequests/${requestId}/response`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        newStatus,
        associationResponse,
        collectionMode
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw errorText;
  }

  return await response.text();
}

/**
 * Association's own incoming donation requests.
 *
 * @param {number} userId
 * @returns {Promise<object[]>}
 * @throws {string} user-facing error message
 */
export async function getAssociationDonationRequests(userId) {
  const response = await fetch(
    `${API_BASE_URL}/DonationRequests/association/user/${userId}`,
    {
      method: "GET",
      headers: getAuthHeaders()
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw errorText;
  }

  return await response.json();
}

/**
 * Association offers collection assistance for an already-accepted
 * request to one active partner Store.
 *
 * @param {number} requestId
 * @param {number} storeId
 * @throws {string} user-facing error message
 */
export async function offerCollectionToStore(requestId, storeId) {
  const response = await fetch(
    `${API_BASE_URL}/DonationRequests/${requestId}/offer-collection`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ storeId })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw errorText;
  }

  return await response.text();
}

/**
 * Store accepts/declines a collection offer currently addressed to it.
 *
 * @param {number} requestId
 * @param {string} newStatus - "approved" | "rejected"
 * @throws {string} user-facing error message
 */
export async function respondToCollectionOffer(requestId, newStatus) {
  const response = await fetch(
    `${API_BASE_URL}/DonationRequests/${requestId}/collection-response`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ newStatus })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw errorText;
  }

  return await response.text();
}

/**
 * Store's list of collection-assistance requests offered/assigned to it.
 *
 * @param {number} userId
 * @returns {Promise<object[]>}
 * @throws {string} user-facing error message
 */
export async function getStoreCollectionOffers(userId) {
  const response = await fetch(
    `${API_BASE_URL}/DonationRequests/store/user/${userId}`,
    {
      method: "GET",
      headers: getAuthHeaders()
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw errorText;
  }

  return await response.json();
}