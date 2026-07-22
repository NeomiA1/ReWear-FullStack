

import { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useUser } from "../context/UserContext";

export default function CollaborationChatPage() {
  const navigate   = useNavigate();
  const { id }     = useParams();
  const location   = useLocation();
  const { collaborations, sendCollabMessage, sentDonations } = useUser();

 
  const isOrg   = location.pathname.startsWith("/org/chat");
  const sender  = isOrg ? "org" : "shop";
  const senderLabel = isOrg ? "העמותה" : "החנות";

  const collab  = collaborations.find(c => c.id === Number(id));
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim()) return;
    sendCollabMessage(Number(id), text.trim(), sender);
    setText("");
  };

  
  const handleSendPickupDetails = () => {
    const approved = sentDonations.filter(d =>
      d.status === "approved" || d.status === "scheduled"
    );
    if (approved.length === 0) {
      alert("אין תיאומי איסוף פעילים כרגע");
      return;
    }
    const latest = approved[approved.length - 1];
    const msg = `📦 פרטי איסוף מלקוח:
שק: ${[latest.bag?.size, latest.bag?.gender, latest.bag?.condition].filter(Boolean).join(" · ") || "שק תרומה"}
יום ושעה: ${latest.pickupTime || "טרם תואם"}
כתובת: ${latest.pickupAddress || "טרם נקבע"}`;
    sendCollabMessage(Number(id), msg, "org");
  };

  if (!collab) {
    return (
      <div className="min-h-screen bg-rw-bg flex items-center justify-center px-6">
        <div className="bg-rw-card rounded-2xl p-6 text-center shadow-sm">
          <p className="text-3xl mb-2">⚠️</p>
          <p className="text-rw-title font-semibold mb-1">שיתוף פעולה לא נמצא</p>
          <button onClick={() => navigate(-1)}
            className="mt-4 bg-rw-btn text-white rounded-xl px-4 py-2 text-sm">
            חזרה
          </button>
        </div>
      </div>
    );
  }

  // הצ'אט נגיש רק אחרי אישור שיתוף הפעולה — גם אם ניגשים ישירות ל-URL
  // (למשל בקשה ממתינה או שנדחתה), לא נפתח כאן שום צ'אט.
  if (collab.status !== "approved") {
    const isRejected = collab.status === "rejected";
    return (
      <div className="min-h-screen bg-rw-bg flex items-center justify-center px-6">
        <div className="bg-rw-card rounded-2xl p-6 text-center shadow-sm">
          <p className="text-3xl mb-2">{isRejected ? "🚫" : "⏳"}</p>
          <p className="text-rw-title font-semibold mb-1">
            {isRejected
              ? "בקשת שיתוף הפעולה נדחתה"
              : "הצ׳אט ייפתח לאחר אישור שיתוף הפעולה"}
          </p>
          <button onClick={() => navigate(-1)}
            className="mt-4 bg-rw-btn text-white rounded-xl px-4 py-2 text-sm">
            חזרה
          </button>
        </div>
      </div>
    );
  }

  const messages = collab.messages || [];

  return (
    <div className="min-h-screen bg-rw-bg flex flex-col">

    
      <div className="bg-rw-card px-5 pt-6 pb-4 shadow-sm
                      flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-rw-sub text-2xl shrink-0">
          →
        </button>
        <div className="flex-1 text-right">
          <h1 className="font-bold text-rw-title text-base">
            {isOrg ? collab.shopName : collab.orgName}
          </h1>
          <p className="text-rw-sub text-xs">
            {isOrg ? collab.shopCity : collab.orgCity}
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-rw-logo
                        flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">
            {isOrg ? collab.shopName?.charAt(0) : collab.orgName?.charAt(0)}
          </span>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 flex flex-col gap-3 overflow-y-auto pb-32">

        {messages.length === 0 && (
          <div className="flex flex-col items-center gap-2 pt-16 opacity-50">
            <span className="text-4xl">💬</span>
            <p className="text-rw-sub text-sm">עדיין אין הודעות. התחילי את השיחה!</p>
          </div>
        )}

        {messages.map(msg => {
          const isMine = msg.sender === sender;
          return (
            <div key={msg.id}
              className={`flex ${isMine ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5
                              ${isMine
                                ? "bg-rw-btn text-white rounded-tl-sm"
                                : "bg-rw-card text-rw-title rounded-tr-sm shadow-sm"}`}>
                <p className="text-sm whitespace-pre-line">{msg.text}</p>
                <p className={`text-[10px] mt-1 ${isMine ? "text-white/70" : "text-rw-sub"}`}>
                  {msg.time}
                </p>
              </div>
            </div>
          );
        })}
      </div>

    
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto
                      bg-rw-card border-t border-rw-border px-4 py-3 flex flex-col gap-2">

    
        {isOrg && (
          <button onClick={handleSendPickupDetails}
            className="w-full bg-rw-input text-rw-title rounded-xl py-2
                       text-xs font-semibold border border-rw-border
                       flex items-center justify-center gap-2 active:opacity-70">
            <span>📦</span>
            <span>שלחי פרטי איסוף לחנות</span>
          </button>
        )}

        <div className="flex gap-2 items-end">
          <button onClick={handleSend}
            className="bg-rw-btn text-white rounded-xl px-4 py-3
                       text-sm font-semibold active:bg-rw-btn-hover shrink-0">
            שלח
          </button>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={`כתבי הודעה ל${isOrg ? collab.shopName : collab.orgName}...`}
            dir="rtl"
            className="flex-1 border border-rw-border rounded-xl px-4 py-3
                       text-sm outline-none bg-rw-input focus:border-rw-btn" />
        </div>
      </div>

    </div>
  );
}
