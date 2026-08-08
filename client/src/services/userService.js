import API_BASE_URL from "./api";

export async function registerUser(user) {
  const response = await fetch(`${API_BASE_URL}/Users/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(user)
  });

  const data = await response.text();

  if (!response.ok) {
    throw data;
  }

  return data;
}

export async function loginUser(loginData) {
  const response = await fetch(`${API_BASE_URL}/Users/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(loginData)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw errorText;
  }

  const data = await response.json();

  return {
    ...data.user,
    token: data.token
  };
}