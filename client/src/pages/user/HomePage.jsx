import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import BottomNav from "../../components/BottomNav";
import { getDonationStatusInfo } from "../../utils/statusLabels";

export default function HomePage() {
  const navigate = useNavigate();
  const { user, unreadCount, sentDonations } = useUser();

  // ── חישוב רמת אימפקט לפי מספר תרומות שהושלמו ──────────────────────────
  const completedDonations = (sentDonations || []).filter(d => d.status === "collected").length;
  const impactLevel = completedDonations >= 10 ? "פלטינה" :
                      completedDonations >= 5  ? "זהב"    :
                      completedDonations >= 2  ? "כסף"    : "ברונזה";

  if (!user) return null;

  // ── A2: בקשות פעילות מה-Context ──────────────────────────────────────────
  // מציגים רק שלא נסגרו (לא נאספו ולא נדחו)
  const activeDonations = (sentDonations || []).filter(
    d => d.status !== "collected" && d.status !== "rejected"
  ).slice(0, 3); // מקסימום 3 בדף הבית

  return (
    <div className="min-h-screen bg-rw-bg pb-24">

      {/* ── כותרת עליונה ── */}
      <div className="flex justify-between items-center px-5 pt-6 pb-4">

        <div className="relative">
          <div onClick={() => navigate("/notifications")}
            className="w-10 h-10 bg-rw-card rounded-xl flex items-center
                       justify-center shadow-sm cursor-pointer">
            <span className="text-lg">🔔</span>
          </div>
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-400
                            rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">{unreadCount}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="font-bold text-rw-title text-base">
              שלום, {user.fullName}
            </span>
            <span className="text-xs text-rw-sub">רמת אימפקט: {impactLevel}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-rw-logo
                          flex items-center justify-center">
            <span className="text-white font-bold">{user.fullName.charAt(0)}</span>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-6">

        {/* ── כרטיס ירוק ── */}
        <div className="bg-rw-btn rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute -top-4 -left-4 w-24 h-24 bg-white rounded-full opacity-10"></div>
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white rounded-full opacity-10"></div>
          <div className="relative z-10">
            <h2 className="text-white text-xl font-bold leading-snug mb-2">
              הגיע הזמן לסדר את הארון?
            </h2>
            <p className="text-white text-xs opacity-80 mb-4">
              הבגדים שלך יכולים לשנות חיים של מישהו אחר.
            </p>
            <button onClick={() => navigate("/upload")}
              className="bg-white text-rw-btn rounded-xl px-5 py-2.5
                         text-sm font-semibold flex items-center gap-2">
              <span>⊕</span>
              <span>תרומה חדשה</span>
            </button>
          </div>
        </div>

        {/* ── סטטיסטיקה ── */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-rw-card rounded-2xl p-4 shadow-sm flex flex-col items-center">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-2">
              <span className="text-xl">👕</span>
            </div>
            <span className="text-rw-sub text-xs mb-1">פריטים שנתרמו</span>
            <span className="text-2xl font-bold text-rw-title">
              {typeof user.itemsDonated === "number" ? user.itemsDonated : "—"}
            </span>
          </div>
          <div className="bg-rw-card rounded-2xl p-4 shadow-sm flex flex-col items-center">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-2">
              <span className="text-xl">🌲</span>
            </div>
            <span className="text-rw-sub text-xs mb-1">ליטר מים נחסכו</span>
            <span className="text-2xl font-bold text-rw-title">
              {typeof user.waterSaved === "number" ? user.waterSaved : "—"}
            </span>
          </div>
        </div>

        {/* ── A2: ממתין לאיסוף – מחובר ל-sentDonations ── */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <span onClick={() => navigate("/notifications")}
              className="text-rw-green text-sm cursor-pointer">
              צפה בהכל
            </span>
            <span className="font-bold text-rw-title text-base">ממתין לאיסוף</span>
          </div>

          {activeDonations.length === 0 ? (
            <div className="bg-rw-card rounded-2xl p-4 shadow-sm text-center">
              <p className="text-rw-sub text-sm">אין פריטים ממתינים כרגע</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {activeDonations.map(donation => {
                const statusInfo = getDonationStatusInfo(donation.status);
                const isApproved = donation.status === "approved";
                return (
                  <div key={donation.id}
                    onClick={() => isApproved ? navigate(`/pickup/${donation.id}`) : null}
                    className={`bg-rw-card rounded-2xl shadow-sm p-4
                               flex items-center justify-between
                               ${isApproved ? "cursor-pointer border-2 border-blue-100" : ""}`}>
                    <div className="flex items-center gap-2">
                      {isApproved && (
                        <span className="text-blue-500 text-lg">←</span>
                      )}
                      <span className={`text-xs font-bold px-2 py-1 rounded-full
                                       ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-semibold text-rw-title text-sm">
                        {donation.org?.name || "עמותה"}
                      </span>
                      <span className="text-xs text-rw-sub">
                        {[donation.bag?.size, donation.bag?.gender, donation.bag?.condition]
                          .filter(Boolean).join(" · ") || "שק תרומה"}
                      </span>
                      <span className="text-xs text-rw-sub">{donation.date}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      <BottomNav active="home" />
    </div>
  );
}
