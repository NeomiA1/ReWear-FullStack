import { BrowserRouter, Routes, Route } from "react-router-dom";
import RequireAuth from "./components/RequireAuth";

// Auth
import LoginPage           from "./pages/auth/LoginPage";
import RegisterTypePage    from "./pages/auth/RegisterTypePage";
import RegisterPrivatePage from "./pages/auth/RegisterPrivatePage";
import RegisterCausesPage  from "./pages/auth/RegisterCausesPage";
import RegisterOrgPage     from "./pages/auth/RegisterOrgPage";
import RegisterShopPage    from "./pages/auth/RegisterShopPage";

// User
import HomePage             from "./pages/user/HomePage";
import UploadDonationPage   from "./pages/user/UploadDonationPage";
import ProfilePage          from "./pages/user/ProfilePage";
import MapPage              from "./pages/user/MapPage";
import NotificationsPage    from "./pages/user/NotificationsPage";
import PickupSchedulingPage from "./pages/user/PickupSchedulingPage";
import DonationStatusPage   from "./pages/user/DonationStatusPage";
import ImpactPage           from "./pages/user/ImpactPage";

// Org
import OrgHomePage          from "./pages/org/OrgHomePage";
import OrgProfilePage       from "./pages/org/OrgProfilePage";
import OrgNotificationsPage from "./pages/org/OrgNotificationsPage";
import OrgRequestsPage      from "./pages/org/OrgRequestsPage";
import OrgPickupsPage       from "./pages/org/OrgPickupsPage";
import OrgCollaborationsPage from "./pages/org/OrgCollaborationsPage";

// Shop
import ShopHomePage         from "./pages/shop/ShopHomePage";
import ShopPartnersPage     from "./pages/shop/ShopPartnersPage";
import ShopProfilePage      from "./pages/shop/ShopProfilePage";
import ShopInventoryPage    from "./pages/shop/ShopInventoryPage";
import ShopNotificationsPage from "./pages/shop/ShopNotificationsPage";

// Chat
import CollaborationChatPage from "./pages/CollaborationChatPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/"                  element={<LoginPage />} />
        <Route path="/register"          element={<RegisterTypePage />} />
        <Route path="/register/private"        element={<RegisterPrivatePage />} />
        <Route path="/register/private/causes" element={<RequireAuth allowedRoles="private"><RegisterCausesPage /></RequireAuth>} />
        <Route path="/register/org"      element={<RegisterOrgPage />} />
        <Route path="/register/shop"     element={<RegisterShopPage />} />

        {/* User */}
        <Route path="/home"              element={<RequireAuth allowedRoles="private"><HomePage /></RequireAuth>} />
        <Route path="/upload"            element={<RequireAuth allowedRoles="private"><UploadDonationPage /></RequireAuth>} />
        <Route path="/profile"           element={<RequireAuth allowedRoles="private"><ProfilePage /></RequireAuth>} />
        <Route path="/map"               element={<RequireAuth allowedRoles="private"><MapPage /></RequireAuth>} />
        <Route path="/notifications"     element={<RequireAuth allowedRoles="private"><NotificationsPage /></RequireAuth>} />
        <Route path="/pickup/:id"        element={<RequireAuth allowedRoles="private"><PickupSchedulingPage /></RequireAuth>} />
        <Route path="/status"            element={<RequireAuth allowedRoles="private"><DonationStatusPage /></RequireAuth>} />
        <Route path="/impact"            element={<RequireAuth allowedRoles="private"><ImpactPage /></RequireAuth>} />

        {/* Org */}
        <Route path="/org/home"              element={<RequireAuth allowedRoles="org"><OrgHomePage /></RequireAuth>} />
        <Route path="/org/profile"           element={<RequireAuth allowedRoles="org"><OrgProfilePage /></RequireAuth>} />
        <Route path="/org/notifications"     element={<RequireAuth allowedRoles="org"><OrgNotificationsPage /></RequireAuth>} />
        <Route path="/org/requests"          element={<RequireAuth allowedRoles="org"><OrgRequestsPage /></RequireAuth>} />
        <Route path="/org/pickups"           element={<RequireAuth allowedRoles="org"><OrgPickupsPage /></RequireAuth>} />
        <Route path="/org/collaborations"    element={<RequireAuth allowedRoles="org"><OrgCollaborationsPage /></RequireAuth>} />

        {/* Shop */}
        <Route path="/shop/home"         element={<RequireAuth allowedRoles="shop"><ShopHomePage /></RequireAuth>} />
        <Route path="/shop/partners"     element={<RequireAuth allowedRoles="shop"><ShopPartnersPage /></RequireAuth>} />
        <Route path="/shop/profile"      element={<RequireAuth allowedRoles="shop"><ShopProfilePage /></RequireAuth>} />
        <Route path="/shop/inventory"    element={<RequireAuth allowedRoles="shop"><ShopInventoryPage /></RequireAuth>} />
        <Route path="/shop/notifications" element={<RequireAuth allowedRoles="shop"><ShopNotificationsPage /></RequireAuth>} />

        {/* Chat */}
        <Route path="/org/chat/:id"      element={<RequireAuth allowedRoles="org"><CollaborationChatPage /></RequireAuth>} />
        <Route path="/shop/chat/:id"     element={<RequireAuth allowedRoles="shop"><CollaborationChatPage /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
