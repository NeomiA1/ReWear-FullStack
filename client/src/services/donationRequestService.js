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

/**
 * Association proposes pickup day/time options for a request that's
 * ready to be scheduled (self collection, or a store already accepted).
 *
 * @param {number} requestId
 * @param {string} proposedDays - comma-separated day labels
 * @param {string} proposedTimes - comma-separated time-range labels
 * @throws {string} user-facing error message
 */
export async function proposePickupOptions(requestId, proposedDays, proposedTimes) {
  const response = await fetch(
    `${API_BASE_URL}/DonationRequests/${requestId}/propose-pickup`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ proposedDays, proposedTimes })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw errorText;
  }

  return await response.text();
}

/**
 * Donor selects exactly one of the proposed pickup day/time options.
 *
 * @param {number} requestId
 * @param {string} selectedDay
 * @param {string} selectedTime
 * @throws {string} user-facing error message
 */
export async function selectPickupOption(requestId, selectedDay, selectedTime) {
  const response = await fetch(
    `${API_BASE_URL}/DonationRequests/${requestId}/pickup-selection`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ selectedDay, selectedTime })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw errorText;
  }

  return await response.text();
}

/**
 * Association marks a scheduled pickup as collected — the final step
 * of the donor journey.
 *
 * @param {number} requestId
 * @throws {string} user-facing error message
 */
export async function markDonationCollected(requestId) {
  const response = await fetch(
    `${API_BASE_URL}/DonationRequests/${requestId}/mark-collected`,
    {
      method: "POST",
      headers: getAuthHeaders()
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw errorText;
  }

  return await response.text();
}