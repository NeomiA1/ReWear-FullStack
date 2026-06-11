import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import BottomNav from "../../components/BottomNav";
import { getDonationRequestsByUser } from "../../services/donationRequestService";

export default function NotificationsPage() {

  const navigate = useNavigate();
  const { user, sentDonations } = useUser();

  const [approvedRequests, setApprovedRequests] = useState([]);

  useEffect(() => {
    if (!user?.userId) return;
    getDonationRequestsByUser(user.userId)
      .then(data => {
        // Show only Approved requests in "ממתינות לתיאום איסוף"
        const approved = data
          .filter(r => r.requestStatus === "Approved")
          .map(r => ({
            id:   r.requestId,
            date: new Date(r.requestDate).toLocaleDateString("he-IL"),
            org:  { name: r.associationName },
            bag:  {
              size:      r.sizes           ?? "",
              gender:    r.targetGender    ?? "",
              condition: r.clothesCondition ?? "",
            },
          }));
        setApprovedRequests(approved);
      })
      .catch(err => console.error("שגיאה בטעינת בקשות:", err));
  }, [user?.userId]);

  // צ'אטים — unchanged, still from sentDonations context
  const withChat = sentDonations.filter(d => d.hasChat);

  // alias used by the existing JSX below
  const pendingPickup = approvedRequests;

  return (
    <div className="min-h-screen bg-rw-bg pb-28 overflow-y-auto">

      {/* כותרת */}
      <div className="sticky top-0 bg-rw-bg z-10
                      flex items-center justify-between
                      px-5 py-4 border-b border-rw-border">
        <button onClick={() => navigate("/home")} className="text-rw-sub text-2xl">
          →
        </button>
        <h1 className="font-bold text-rw-title text-base">התראות</h1>
        <div className="w-6"></div>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-6">

        {/* ── סוג 1: ממתינות לתיאום איסוף ── */}
        <div>
          <h2 className="font-bold text-rw-title text-sm mb-3 flex items-center gap-2">
            <span>📦</span>
            <span>ממתינות לתיאום איסוף ({pendingPickup.length})</span>
          </h2>

          {pendingPickup.length === 0 ? (
            <div className="bg-rw-card rounded-2xl p-4 text-center shadow-sm">
              <p className="text-rw-sub text-sm">אין תרומות ממתינות</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {pendingPickup.map((donation) => (
                <div
                  key={donation.id}
                  onClick={() => navigate(`/pickup/${donation.id}`)}
                  className="bg-rw-card rounded-2xl shadow-sm p-4 cursor-pointer
                             border-2 border-yellow-100 active:bg-rw-input"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* חץ שמאלה = לחיצה פותחת תיאום */}
                      <span className="text-rw-sub text-lg">←</span>
                      <span className="bg-yellow-50 text-yellow-600 text-xs
                                       px-2 py-1 rounded-full">
                        טעון תיאום
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-semibold text-rw-title text-sm">
                        {donation.org.name}
                      </span>
                      <span className="text-xs text-rw-sub">
                        {[donation.bag.size, donation.bag.gender, donation.bag.condition]
                          .filter(Boolean).join(" · ")}
                      </span>
                      <span className="text-xs text-rw-sub">{donation.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── סוג 2: צ'אטים קיימים ── */}
        <div>
          <h2 className="font-bold text-rw-title text-sm mb-3 flex items-center gap-2">
            <span>💬</span>
            <span>צ'אטים ({withChat.length})</span>
          </h2>

          {withChat.length === 0 ? (
            <div className="bg-rw-card rounded-2xl p-4 text-center shadow-sm">
              <p className="text-rw-sub text-sm">אין צ'אטים פעילים</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {withChat.map((donation) => (
                <div
                  key={donation.id}
                  className="bg-rw-card rounded-2xl shadow-sm p-4
                             border-2 border-blue-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="bg-blue-50 text-blue-500 text-xs
                                     px-2 py-1 rounded-full">
                      צ'אט פעיל
                    </span>
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-semibold text-rw-title text-sm">
                        {donation.org.name}
                      </span>
                      <span className="text-xs text-rw-sub">{donation.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <BottomNav />
    </div>
  );
}