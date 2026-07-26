// src/pages/shop/ShopPartnersPage.jsx
//
// ─── הסבר ───────────────────────────────────────────────────────────────────
//
// החנות רואה כאן בקשות שיתוף פעולה שהגיעו מעמותות.
//
// איך בקשה מגיעה?
//   עמותה לחצה "שלחי בקשת שיתוף פעולה" ב-OrgHomePage
//   → sendCollaborationRequest(org, shop) נקראת ב-Context
//   → רשומה נוצרת ב-collaborations[] עם status: "pending"
//
// אישור/דחייה:
//   updateCollaboration(id, { status: "approved" / "rejected" })
//   → הסטטוס מתעדכן ב-Context + localStorage
//   → אחרי אישור – מופיע כפתור "פתחי צ׳אט"
//
// צ׳אט:
//   לחיצה על "פתחי צ׳אט" → navigate לדף הצ׳אט עם id השיתוף

import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import ShopBottomNav from "../../components/ShopBottomNav";
import { getCollabStatusInfo } from "../../utils/statusLabels";

function CollabCard({ collab, onApprove, onReject, onChat }) {
  const statusInfo = getCollabStatusInfo(collab.status);
  const isDone     = collab.status === "approved" || collab.status === "rejected";

  return (
    <div className="bg-rw-card rounded-2xl shadow-sm p-4 flex flex-col gap-3">

      {/* שורה עליונה */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-rw-logo
                        flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">
            {collab.orgName?.charAt(0)}
          </span>
        </div>
        <div className="flex flex-col items-end flex-1">
          <span className="font-bold text-rw-title text-sm">{collab.orgName}</span>
          <span className="text-rw-sub text-xs">{collab.orgCity}</span>
          <span className="text-rw-green text-xs font-medium">{collab.orgTypes}</span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0
                         ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      </div>

      {/* תאריך בקשה */}
      <div className="bg-rw-bg rounded-xl px-3 py-2">
        <p className="text-rw-sub text-xs text-right">📅 נשלח ב-{collab.date}</p>
      </div>

      {/* כפתורים */}
      {!isDone ? (
        <div className="flex gap-2">
          <button onClick={() => onReject(collab.id)}
            className="flex-1 border border-red-200 text-red-400 rounded-xl
                       py-2 text-xs font-semibold active:bg-red-50">
            דחה
          </button>
          <button onClick={() => onApprove(collab.id)}
            className="flex-1 bg-rw-btn text-white rounded-xl
                       py-2 text-xs font-semibold active:bg-rw-btn-hover">
            אשר שיתוף פעולה
          </button>
        </div>
      ) : collab.status === "approved" ? (
        <button onClick={() => onChat(collab.id)}
          className="w-full bg-rw-btn/10 text-rw-btn border border-rw-btn/30
                     rounded-xl py-2 text-xs font-semibold active:bg-rw-btn/20
                     flex items-center justify-center gap-2">
          <span>💬</span>
          <span>פתחי צ׳אט עם {collab.orgName}</span>
        </button>
      ) : null}

    </div>
  );
}

export default function ShopPartnersPage() {
  const navigate = useNavigate();
  const { collaborations, updateCollaboration } = useUser();

  // collaborations שמגיע מה-Context כבר מסונן לחנות המחוברת בלבד
  // (ראו scopedToCurrentUser / myCollaborations ב-UserContext.jsx)
  const pending  = collaborations.filter(c => c.status === "pending");
  const approved = collaborations.filter(c => c.status === "approved");
  const rejected = collaborations.filter(c => c.status === "rejected");

  const handleApprove = (id) => updateCollaboration(id, { status: "approved" });
  const handleReject  = (id) => updateCollaboration(id, { status: "rejected" });
  const handleChat    = (id) => navigate(`/shop/chat/${id}`);

  return (
    <div className="min-h-screen bg-rw-bg pb-24 overflow-y-auto">

      {/* Header */}
      <div className="bg-rw-card px-5 pt-6 pb-4 shadow-sm
                      flex items-center justify-between">
        <div className="flex flex-col items-end">
          <h1 className="font-bold text-rw-title text-base">שיתופי פעולה</h1>
          <p className="text-rw-sub text-xs mt-0.5">
            {pending.length} בקשות ממתינות לאישור
          </p>
        </div>
        <div className="w-10 h-10 bg-rw-input rounded-xl
                        flex items-center justify-center">
          <span className="text-lg">🤝</span>
        </div>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-4">

        {/* ממתינות לאישור */}
        {pending.length > 0 && (
          <div>
            <h2 className="font-bold text-rw-title text-sm mb-3 text-right">
              ממתינות לאישור ({pending.length})
            </h2>
            <div className="flex flex-col gap-3">
              {pending.map(c => (
                <CollabCard key={c.id} collab={c}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onChat={handleChat} />
              ))}
            </div>
          </div>
        )}

        {/* שיתופים פעילים */}
        {approved.length > 0 && (
          <div>
            <h2 className="font-bold text-rw-title text-sm mb-3 text-right">
              שיתופים פעילים ({approved.length})
            </h2>
            <div className="flex flex-col gap-3">
              {approved.map(c => (
                <CollabCard key={c.id} collab={c}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onChat={handleChat} />
              ))}
            </div>
          </div>
        )}

        {/* אין בקשות */}
        {collaborations.length === 0 && (
          <div className="flex flex-col items-center gap-3 pt-16">
            <span className="text-5xl">🤝</span>
            <p className="font-bold text-rw-title text-base">אין בקשות שיתוף פעולה</p>
            <p className="text-rw-sub text-sm text-center">
              כשעמותה תשלח בקשה – היא תופיע כאן.
            </p>
          </div>
        )}

        {/* נדחו */}
        {rejected.length > 0 && (
          <div className="opacity-50">
            <h2 className="font-bold text-rw-title text-sm mb-3 text-right">
              נדחו ({rejected.length})
            </h2>
            <div className="flex flex-col gap-3">
              {rejected.map(c => (
                <CollabCard key={c.id} collab={c}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onChat={handleChat} />
              ))}
            </div>
          </div>
        )}

      </div>

      <ShopBottomNav active="partners" />
    </div>
  );
}
