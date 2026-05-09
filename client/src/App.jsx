import { BrowserRouter, Routes, Route } from "react-router-dom";

// Auth
import LoginPage           from "./pages/auth/LoginPage";
import RegisterTypePage    from "./pages/auth/RegisterTypePage";
import RegisterPrivatePage from "./pages/auth/RegisterPrivatePage";
import RegisterOrgPage     from "./pages/auth/RegisterOrgPage";
import RegisterShopPage    from "./pages/auth/RegisterShopPage";

// User
import HomePage             from "./pages/user/HomePage";
import UploadDonationPage   from "./pages/user/UploadDonationPage";
import ProfilePage          from "./pages/user/ProfilePage";
import MapPage              from "./pages/user/MapPage";
import NotificationsPage    from "./pages/user/NotificationsPage";
import PickupSchedulingPage from "./pages/user/PickupSchedulingPage";

// Org
import OrgHomePage          from "./pages/org/OrgHomePage";
import OrgProfilePage       from "./pages/org/OrgProfilePage";
import OrgNotificationsPage from "./pages/org/OrgNotificationsPage";
import OrgRequestsPage      from "./pages/org/OrgRequestsPage";
import OrgPickupsPage       from "./pages/org/OrgPickupsPage";

// Shop
import ShopHomePage         from "./pages/shop/ShopHomePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/"                  element={<LoginPage />} />
        <Route path="/register"          element={<RegisterTypePage />} />
        <Route path="/register/private"  element={<RegisterPrivatePage />} />
        <Route path="/register/org"      element={<RegisterOrgPage />} />
        <Route path="/register/shop"     element={<RegisterShopPage />} />

        {/* User */}
        <Route path="/home"              element={<HomePage />} />
        <Route path="/upload"            element={<UploadDonationPage />} />
        <Route path="/profile"           element={<ProfilePage />} />
        <Route path="/map"               element={<MapPage />} />
        <Route path="/notifications"     element={<NotificationsPage />} />
        <Route path="/pickup/:id"        element={<PickupSchedulingPage />} />

        {/* Org */}
        <Route path="/org/home"          element={<OrgHomePage />} />
        <Route path="/org/profile"       element={<OrgProfilePage />} />
        <Route path="/org/notifications" element={<OrgNotificationsPage />} />
        <Route path="/org/requests"      element={<OrgRequestsPage />} />
        <Route path="/org/pickups"       element={<OrgPickupsPage />} />

        {/* Shop */}
        <Route path="/shop/home"         element={<ShopHomePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
