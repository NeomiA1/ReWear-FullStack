import API_BASE_URL from "./api";

export async function createDonationBag(bag) {
  const response = await fetch(`${API_BASE_URL}/DonationBags`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(bag)
  });

  
  const data = await response.text();

  if (!response.ok) {
    throw data;
  }

  return data;
  
}

export async function getDonationBagsByUserId(userId) {
    const response = await fetch(`${API_BASE_URL}/DonationBags/user/${userId}`);
  
    if (!response.ok) {
      const errorText = await response.text();
      throw errorText;
    }
  
    const data = await response.json();
    return data;
  }