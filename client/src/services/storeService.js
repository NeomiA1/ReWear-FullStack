import API_BASE_URL from "./api";

export async function registerStore(store) {
  const response = await fetch(`${API_BASE_URL}/Stores`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(store),
  });

  const data = await response.text();
  if (!response.ok) {
    throw data;
  }
  return data;
}
