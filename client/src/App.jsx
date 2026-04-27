import { BrowserRouter, Routes, Route } from "react-router-dom";

// ─── Auth ─────────────────────────────────────────────────────────────────────
import LoginPage          from "./pages/auth/LoginPage";
import RegisterTypePage   from "./pages/auth/RegisterTypePage";
import RegisterPrivatePage from "./pages/auth/RegisterPrivatePage";
import RegisterOrgPage    from "./pages/auth/RegisterOrgPage";
import RegisterShopPage   from "./pages/auth/RegisterShopPage";

// ─── User ─────────────────────────────────────────────────────────────────────
import HomePage           from "./pages/user/HomePage";
import UploadDonationPage from "./pages/user/UploadDonationPage";

// ─── Org ──────────────────────────────────────────────────────────────────────
import OrgHomePage        from "./pages/org/OrgHomePage";
import OrgRequestsPage    from "./pages/org/OrgRequestsPage";
import OrgPickupsPage     from "./pages/org/OrgPickupsPage";

// ─── Shop ─────────────────────────────────────────────────────────────────────
import ShopHomePage       from "./pages/shop/ShopHomePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Auth ── */}
        <Route path="/"                 element={<LoginPage />} />
        <Route path="/register"         element={<RegisterTypePage />} />
        <Route path="/register/private" element={<RegisterPrivatePage />} />
        <Route path="/register/org"     element={<RegisterOrgPage />} />
        <Route path="/register/Shop"    element={<RegisterShopPage />} />

        {/* ── User ── */}
        <Route path="/home"             element={<HomePage />} />
        <Route path="/upload"           element={<UploadDonationPage />} />

        {/* ── Org ── */}
        <Route path="/org/home"         element={<OrgHomePage />} />
        <Route path="/org/requests"     element={<OrgRequestsPage />} />
        <Route path="/org/pickups"      element={<OrgPickupsPage />} />
        {/* /org/profile יתווסף בהמשך */}

        {/* ── Shop ── */}
        <Route path="/shop/home"        element={<ShopHomePage />} />
        {/* /shop/inventory, /shop/partners, /shop/profile יתווספו בהמשך */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
