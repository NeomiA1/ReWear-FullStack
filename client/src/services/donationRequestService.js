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

export async function getDonationRequestsByAssociation(userId) {
  const response = await fetch(
    `${API_BASE_URL}/DonationRequests/association/user/${userId}`
  );

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