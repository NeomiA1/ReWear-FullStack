import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import ShopBottomNav from "../../components/ShopBottomNav";
import PageContainer from "../../components/PageContainer";
import { useNotifications } from "../../hooks/useNotifications";
import { getStoreCollaborationRequests } from "../../services/collaborationService";
import { getCollabStatusInfo } from "../../utils/statusLabels";

// Mirrors ShopPartnersPage's mapCollabRequest: DB status word is "Accepted"
// (CHK_AssociationStoreRequests_request_status doesn't allow "Approved") --
// translated here to the "approved" vocabulary this page's UI already expects.
function mapCollabRequest(r) {
  const rawStatus = (r.requestStatus || "").toLowerCase();
  return {
    id: r.collaborationRequestId,
    orgName: r.associationName,
    orgCity: r.associationCity || "",
    orgTypes: r.associationType || "",
    status: rawStatus === "accepted" ? "approved" : rawStatus,
    date: new Date(r.requestDate).toLocaleDateString("he-IL")
  };
}

export default function ShopHomePage() {
  const navigate = useNavigate();
  const { user, logout } = useUser();
  const { unreadCount } = useNotifications();

  const savedUser = JSON.parse(localStorage.getItem("rewear_user") || "{}");
  const shopName = user?.shopName || savedUser?.shopName || "חנות יד שנייה";

  const [collaborations, setCollaborations] = useState([]);

  useEffect(() => {
    if (!user?.userId) return;
    const loadCollaborations = async () => {
      try {
        const requests = await getStoreCollaborationRequests(user.userId);
        setCollaborations(requests.map(mapCollabRequest));
      } catch {
        // best-effort — leave the list as-is on failure
      }
    };
    loadCollaborations();
  }, [user?.userId]);

  const pendingRequests = collaborations.filter(
    (c) => c.status === "pending"
  );

  const approvedCollaborations = collaborations.filter(
    (c) => c.status === "approved"
  );

  return (
    <PageContainer className="pb-24 overflow-y-auto" wide>

      {/* Header */}
      <div
        className="bg-rw-card px-5 pt-6 pb-4 shadow-sm
                   flex items-center justify-between"
      >
        <button
          onClick={() => {
            logout();
            navigate("/");
          }}
          className="text-xs text-rw-sub border border-rw-border
                     rounded-xl px-3 py-1.5 active:bg-rw-input shrink-0"
        >
          התנתקות
        </button>

        <div className="flex flex-col items-end flex-1 mx-3">
          <h1 className="font-bold text-rw-title text-base">
            {shopName}
          </h1>
          <p className="text-rw-sub text-xs mt-0.5">
            חנות יד שנייה
          </p>
        </div>

        <div
          onClick={() => navigate("/shop/notifications")}
          className="relative w-10 h-10 bg-rw-input rounded-xl
                     flex items-center justify-center cursor-pointer shrink-0"
        >
          <span className="text-lg">🔔</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500
                             text-white text-[10px] font-bold rounded-full
                             flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </div>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-6">

        {/* לוח בקרה */}
        <div>
          <h2 className="font-bold text-rw-title text-base mb-4">
            לוח בקרה
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div
              className="bg-rw-card rounded-2xl p-4 shadow-sm
                         flex flex-col items-center gap-1"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-rw-sub">
                  בקשות ממתינות
                </span>
                <span className="text-xl">⏳</span>
              </div>

              <span className="text-3xl font-extrabold text-rw-title leading-tight my-0.5">
                {pendingRequests.length}
              </span>

              <span className="text-xs text-rw-sub">
                בקשות לשיתוף פעולה
              </span>
            </div>

            <div
              className="bg-rw-card rounded-2xl p-4 shadow-sm
                         flex flex-col items-center gap-1"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-rw-sub">
                  שיתופי פעולה פעילים
                </span>
                <span className="text-xl">🤝</span>
              </div>

              <span className="text-3xl font-extrabold text-rw-title leading-tight my-0.5">
                {approvedCollaborations.length}
              </span>

              <span className="text-xs text-rw-sub">
                עמותות פעילות
              </span>
            </div>
          </div>
        </div>

        {/* בקשות שיתוף פעולה */}
        <div>
          <div className="flex items-center justify-start gap-2 mb-4">
            <h2 className="font-bold text-rw-title text-base">
              בקשות שיתוף פעולה
            </h2>

            <button
              onClick={() => navigate("/shop/partners")}
              className="text-rw-green text-sm font-semibold"
            >
              הצג הכל
            </button>
          </div>

          {pendingRequests.length > 0 ? (
            <div className="flex flex-col gap-3">
              {pendingRequests.slice(0, 3).map((request) => (
                <div
                  key={request.id}
                  className="bg-rw-card rounded-2xl shadow-sm p-4
                             flex items-center justify-between"
                >
                  <button
                    onClick={() => navigate("/shop/partners")}
                    className="bg-rw-btn text-white rounded-xl px-3 py-2
                               text-xs font-semibold active:bg-rw-btn-hover"
                  >
                    לצפייה
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="font-semibold text-rw-title text-sm">
                        {request.orgName}
                      </span>

                      {request.orgCity && (
                        <span className="text-rw-sub text-xs">
                          {request.orgCity}
                        </span>
                      )}

                      <span className="text-amber-500 text-xs font-medium">
                        {getCollabStatusInfo("pending").label}
                      </span>
                    </div>

                    <div
                      className="w-10 h-10 bg-rw-input rounded-xl
                                 flex items-center justify-center shrink-0"
                    >
                      <span className="text-xl">🤲</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="bg-rw-card rounded-2xl shadow-sm p-3
                         flex flex-col items-center gap-1"
            >
              <span className="text-3xl">📭</span>
              <p className="font-semibold text-rw-title text-sm">
                אין בקשות חדשות
              </p>
              <p className="text-rw-sub text-xs text-center">
                בקשות חדשות מעמותות יופיעו כאן
              </p>
            </div>
          )}
        </div>

        {/* שיתופי פעולה פעילים */}
        <div>
          <div className="flex items-center justify-start gap-2 mb-4">
            <h2 className="font-bold text-rw-title text-base">
              שותפים פעילים
            </h2>

            <button
              onClick={() => navigate("/shop/partners")}
              className="text-rw-green text-sm font-semibold"
            >
              לכל השותפים
            </button>
          </div>

          {approvedCollaborations.length > 0 ? (
            <div className="flex flex-col gap-3">
              {approvedCollaborations.slice(0, 3).map((collab) => (
                <div
                  key={collab.id}
                  className="bg-rw-card rounded-2xl shadow-sm p-4
                             flex items-center justify-end gap-4"
                >
                  <button
                    onClick={() =>
                      navigate(`/shop/chat/${collab.id}`)
                    }
                    className="bg-rw-btn/10 text-rw-btn
                               border border-rw-btn/30 rounded-xl
                               px-3 py-2 text-xs font-semibold
                               flex items-center gap-1"
                  >
                    <span>💬</span>
                    <span>צ׳אט</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="font-semibold text-rw-title text-sm">
                        {collab.orgName}
                      </span>

                      {collab.orgCity && (
                        <span className="text-rw-sub text-xs">
                          {collab.orgCity}
                        </span>
                      )}

                      <span className="text-rw-green text-xs font-medium">
                        שיתוף פעולה פעיל
                      </span>
                    </div>

                    <div
                      className="w-10 h-10 bg-rw-input rounded-xl
                                 flex items-center justify-center shrink-0"
                    >
                      <span className="text-xl">🤝</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="bg-rw-card rounded-2xl shadow-sm p-5
                         flex flex-col items-center gap-2"
            >
              <span className="text-3xl">🤝</span>
              <p className="font-semibold text-rw-title text-sm">
                אין שיתופי פעולה פעילים
              </p>
              <p className="text-rw-sub text-xs text-center">
                צפה/י בבקשות שיתוף פעולה ואשר/י עמותות מתאימות
              </p>

              <button
                onClick={() => navigate("/shop/partners")}
                className="mt-2 bg-rw-btn text-white rounded-xl
                           px-5 py-2.5 text-sm font-semibold"
              >
                לבקשות שיתוף פעולה
              </button>
            </div>
          )}
        </div>

      </div>

      <ShopBottomNav active="home" />
    </PageContainer>
  );
}