// src/pages/org/OrgCollaborationsPage.jsx
// מסך שיתופי פעולה של העמותה עם חנויות יד שנייה

import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import OrgBottomNav from "../../components/OrgBottomNav";

const STATUS_DISPLAY = {
  pending:  { label: "ממתין לאישור החנות", color: "bg-amber-50 text-amber-500"  },
  approved: { label: "שיתוף פעיל ✓",       color: "bg-green-50 text-green-600"  },
  rejected: { label: "נדחה",                color: "bg-red-50 text-red-400"      },
};

function CollabCard({ collab, onChat }) {
  const statusInfo = STATUS_DISPLAY[collab.status] || STATUS_DISPLAY.pending;
  const isApproved = collab.status === "approved";

  return (
    <div className="bg-rw-card rounded-2xl shadow-sm p-4 flex flex-col gap-3">

      {/* שורה עליונה */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-rw-input
                        flex items-center justify-center shrink-0">
          <span className="text-xl">🏪</span>
        </div>
        <div className="flex flex-col items-end flex-1">
          <span className="font-bold text-rw-title text-sm">{collab.shopName}</span>
          <span className="text-rw-sub text-xs">{collab.shopCity}</span>
          <span className="text-rw-green text-xs font-medium">{collab.shopItems}</span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0
                         ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      </div>

      <div className="bg-rw-bg rounded-xl px-3 py-2">
        <p className="text-xs text-rw-sub text-right">📅 נשלח ב-{collab.date}</p>
      </div>

      {/* כפתור צ'אט אחרי אישור */}
      {isApproved && (
        <button onClick={() => onChat(collab.id)}
          className="w-full bg-rw-btn/10 text-rw-btn border border-rw-btn/30
                     rounded-xl py-2.5 text-xs font-semibold active:bg-rw-btn/20
                     flex items-center justify-center gap-2">
          <span>💬</span>
          <span>פתחי צ׳אט עם {collab.shopName}</span>
        </button>
      )}
    </div>
  );
}

export default function OrgCollaborationsPage() {
  const navigate      = useNavigate();
  const { collaborations } = useUser();

  const all      = collaborations || [];
  const pending  = all.filter(c => c.status === "pending");
  const approved = all.filter(c => c.status === "approved");
  const rejected = all.filter(c => c.status === "rejected");

  const handleChat = (id) => navigate(`/org/chat/${id}`);

  return (
    <div className="min-h-screen bg-rw-bg pb-24 overflow-y-auto">

      {/* Header */}
      <div className="bg-rw-card px-5 pt-6 pb-4 shadow-sm
                      flex items-center justify-between">
        <div className="flex flex-col items-end">
          <h1 className="font-bold text-rw-title text-base">שיתופי פעולה</h1>
          <p className="text-rw-sub text-xs mt-0.5">
            {approved.length} שיתופים פעילים · {pending.length} ממתינים
          </p>
        </div>
        <div className="w-10 h-10 bg-rw-input rounded-xl
                        flex items-center justify-center">
          <span className="text-lg">🤝</span>
        </div>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-4">

        {/* פעילים */}
        {approved.length > 0 && (
          <div>
            <h2 className="font-bold text-rw-title text-sm mb-3 text-right">
              פעילים ({approved.length})
            </h2>
            <div className="flex flex-col gap-3">
              {approved.map(c => (
                <CollabCard key={c.id} collab={c} onChat={handleChat} />
              ))}
            </div>
          </div>
        )}

        {/* ממתינים */}
        {pending.length > 0 && (
          <div>
            <h2 className="font-bold text-rw-title text-sm mb-3 text-right">
              ממתינים לאישור החנות ({pending.length})
            </h2>
            <div className="flex flex-col gap-3">
              {pending.map(c => (
                <CollabCard key={c.id} collab={c} onChat={handleChat} />
              ))}
            </div>
          </div>
        )}

        {/* ריק */}
        {all.length === 0 && (
          <div className="flex flex-col items-center gap-3 pt-16">
            <span className="text-5xl">🤝</span>
            <p className="font-bold text-rw-title text-base">אין שיתופי פעולה עדיין</p>
            <p className="text-rw-sub text-sm text-center">
              שלחי בקשת שיתוף לחנות מדף הבית
            </p>
            <button onClick={() => navigate("/org/home")}
              className="mt-2 bg-rw-btn text-white rounded-xl
                         px-6 py-2.5 text-sm font-semibold">
              לדף הבית
            </button>
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
                <CollabCard key={c.id} collab={c} onChat={handleChat} />
              ))}
            </div>
          </div>
        )}

      </div>

      <OrgBottomNav active="collaborations" />
    </div>
  );
}
