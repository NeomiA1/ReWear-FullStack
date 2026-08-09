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

export async function sendCollaborationRequest(storeId) {
  const response = await fetch(`${API_BASE_URL}/CollaborationRequests`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ storeId })
  });

  const data = await response.text();

  if (!response.ok) {
    throw data;
  }

  return JSON.parse(data);
}

export async function getAssociationCollaborationRequests(userId) {
  const response = await fetch(
    `${API_BASE_URL}/CollaborationRequests/association/user/${userId}`,
    {
      method: "GET",
      headers: getAuthHeaders()
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw errorText;
  }

  return response.json();
}

export async function getStoreCollaborationRequests(userId) {
  const response = await fetch(
    `${API_BASE_URL}/CollaborationRequests/store/user/${userId}`,
    {
      method: "GET",
      headers: getAuthHeaders()
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw errorText;
  }

  return response.json();
}

export async function respondToCollaborationRequest(collaborationRequestId, newStatus) {
  const response = await fetch(
    `${API_BASE_URL}/CollaborationRequests/${collaborationRequestId}/response`,
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

  return response.text();
}
