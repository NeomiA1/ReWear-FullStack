import { BrowserRouter, Routes, Route } from "react-router-dom";
import RequireAuth from "./components/RequireAuth";

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

// Chat
import CollaborationChatPage from "./pages/CollaborationChatPage";

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
        <Route path="/home"              element={<RequireAuth type="private"><HomePage /></RequireAuth>} />
        <Route path="/upload"            element={<RequireAuth type="private"><UploadDonationPage /></RequireAuth>} />
        <Route path="/profile"           element={<RequireAuth type="private"><ProfilePage /></RequireAuth>} />
        <Route path="/map"               element={<RequireAuth type="private"><MapPage /></RequireAuth>} />
        <Route path="/notifications"     element={<RequireAuth type="private"><NotificationsPage /></RequireAuth>} />
        <Route path="/pickup/:id"        element={<RequireAuth type="private"><PickupSchedulingPage /></RequireAuth>} />
        <Route path="/status"            element={<RequireAuth type="private"><DonationStatusPage /></RequireAuth>} />
        <Route path="/impact"            element={<RequireAuth type="private"><ImpactPage /></RequireAuth>} />

        {/* Org */}
        <Route path="/org/home"              element={<RequireAuth type="org"><OrgHomePage /></RequireAuth>} />
        <Route path="/org/profile"           element={<RequireAuth type="org"><OrgProfilePage /></RequireAuth>} />
        <Route path="/org/notifications"     element={<RequireAuth type="org"><OrgNotificationsPage /></RequireAuth>} />
        <Route path="/org/requests"          element={<RequireAuth type="org"><OrgRequestsPage /></RequireAuth>} />
        <Route path="/org/pickups"           element={<RequireAuth type="org"><OrgPickupsPage /></RequireAuth>} />
        <Route path="/org/collaborations"    element={<RequireAuth type="org"><OrgCollaborationsPage /></RequireAuth>} />

        {/* Shop */}
        <Route path="/shop/home"         element={<RequireAuth type="shop"><ShopHomePage /></RequireAuth>} />
        <Route path="/shop/partners"     element={<RequireAuth type="shop"><ShopPartnersPage /></RequireAuth>} />
        <Route path="/shop/profile"      element={<RequireAuth type="shop"><ShopProfilePage /></RequireAuth>} />
        <Route path="/shop/inventory"    element={<RequireAuth type="shop"><ShopInventoryPage /></RequireAuth>} />

        {/* Chat */}
        <Route path="/org/chat/:id"      element={<RequireAuth type="org"><CollaborationChatPage /></RequireAuth>} />
        <Route path="/shop/chat/:id"     element={<RequireAuth type="shop"><CollaborationChatPage /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
