// VITE_API_URL is set in client/.env.production for the Vercel build.
// The fallback below is the same deployed Azure API — never localhost —
// so local `npm run dev` (which doesn't load .env.production) still talks
// to a real backend.
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://rewear-api-ruppin-bkfvbye2fpdtfegm.israelcentral-01.azurewebsites.net/api";

export default API_BASE_URL;
