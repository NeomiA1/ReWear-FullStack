import { useNavigate } from "react-router-dom";
import PageContainer from "../../components/PageContainer";
import NotificationCard from "../../components/NotificationCard";
import ShopBottomNav from "../../components/ShopBottomNav";
import { useNotifications } from "../../hooks/useNotifications";

export default function ShopNotificationsPage() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const handleOpen = (notification) => {
    markAsRead(notification.id);
    if (notification.targetRoute) navigate(notification.targetRoute);
  };

  return (
    <PageContainer className="pb-24 overflow-y-auto" wide>

      {/* כותרת */}
      <div className="sticky top-0 bg-rw-bg z-10
                      flex items-center justify-between
                      px-5 py-4 border-b border-rw-border">
        <button onClick={() => navigate("/shop/home")} className="text-rw-sub text-2xl">
          →
        </button>
        <h1 className="font-bold text-rw-title text-base">התראות</h1>
        {unreadCount > 0 ? (
          <div className="bg-rw-btn text-white text-xs font-bold
                          w-6 h-6 rounded-full flex items-center justify-center">
            {unreadCount}
          </div>
        ) : <div className="w-6" />}
      </div>

      <div className="px-5 pt-5 flex flex-col gap-4">

        {notifications.length > 0 && (
          <div className="flex justify-end">
            <button onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="text-rw-green text-xs font-semibold disabled:opacity-40 disabled:cursor-default">
              סימון הכל כנקרא
            </button>
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="bg-rw-card rounded-2xl p-8 text-center shadow-sm mt-10">
            <p className="text-3xl mb-2">🔔</p>
            <p className="text-rw-sub text-sm">אין התראות חדשות כרגע</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {notifications.map(n => (
              <NotificationCard key={n.id} notification={n} onClick={handleOpen} />
            ))}
          </div>
        )}

      </div>

      <ShopBottomNav active="home" />
    </PageContainer>
  );
}
