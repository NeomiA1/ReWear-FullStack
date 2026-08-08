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

export async function createDonationBag(bag) {
  const response = await fetch(`${API_BASE_URL}/DonationBags`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(bag)
  });

  const data = await response.text();

  if (!response.ok) {
    throw data;
  }

  return data;
}

export async function getDonationBagsByUserId(userId) {
  const response = await fetch(
    `${API_BASE_URL}/DonationBags/user/${userId}`,
    {
      method: "GET",
      headers: getAuthHeaders()
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw errorText;
  }

  const data = await response.json();
  return data;
}

/**
 * Updates a DonationBag's lifecycle status.
 *
 * @param {number} bagId
 * @param {string} status - one of DonationBag.AllowedStatuses server-side:
 *   "Draft" | "Published" | "WaitingForAssociation" | "Accepted" |
 *   "Rejected" | "PickupScheduled" | "Completed"
 * @returns {Promise<{bagId: number, status: string, message: string}>}
 * @throws {string} user-facing error message
 */
export async function updateDonationBagStatus(bagId, status) {
  const response = await fetch(
    `${API_BASE_URL}/DonationBags/${bagId}/status`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw errorText;
  }

  return response.json();
}