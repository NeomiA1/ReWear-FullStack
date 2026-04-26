import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { UserProvider } from "./context/UserContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <UserProvider>
      {/* מעטפת האייפון – עוטפת את כל האפליקציה */}
      <div id="phone-wrapper">
        <App />
      </div>
    </UserProvider>
  </StrictMode>
);