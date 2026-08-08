import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUser } from "../context/UserContext";
import PageContainer from "../components/PageContainer";
import { useToast } from "../hooks/useToast";

export default function CollaborationChatPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const {
    user,
    collaborations,
    addCollaborationMessage,
    updateCollaboration,
  } = useUser();

  const toast = useToast();

  const collaboration = collaborations.find(
    (c) => c.id === Number(id)
  );

  const [message, setMessage] = useState("");
  const [pickupDetails, setPickupDetails] = useState("");

  if (!collaboration) {
    return (
      <div className="min-h-screen bg-rw-bg flex items-center justify-center px-6">
        <div className="bg-rw-card rounded-2xl p-6 shadow-sm text-center">
          <p className="text-3xl mb-2">⚠️</p>

          <p className="font-semibold text-rw-title">
            שיתוף הפעולה לא נמצא
          </p>

          <button
            onClick={() => navigate(-1)}
            className="mt-4 bg-rw-btn text-white rounded-xl px-5 py-2.5 text-sm font-semibold"
          >
            חזרה
          </button>
        </div>
      </div>
    );
  }

  const isOrg = user?.type === "org";

  const partnerName = isOrg
    ? collaboration.shopName
    : collaboration.orgName;

  const messages = collaboration.messages || [];

  const handleSendMessage = () => {
    if (!message.trim()) return;

    addCollaborationMessage(collaboration.id, {
      sender: isOrg ? "org" : "shop",
      senderName: isOrg
        ? collaboration.orgName
        : collaboration.shopName,
      text: message.trim(),
      date: new Date().toLocaleString("he-IL"),
    });

    setMessage("");
  };

  const handleSendPickupDetails = () => {
    if (!pickupDetails.trim()) {
      toast.warning("יש להזין פרטי איסוף");
      return;
    }

    addCollaborationMessage(collaboration.id, {
      sender: "org",
      senderName: collaboration.orgName,
      text: `📦 פרטי איסוף: ${pickupDetails.trim()}`,
      date: new Date().toLocaleString("he-IL"),
    });

    updateCollaboration(collaboration.id, {
      pickupDetails: pickupDetails.trim(),
    });

    setPickupDetails("");

    toast.success("פרטי האיסוף נשלחו לחנות");
  };

  return (
    <PageContainer className="min-h-screen flex flex-col">

      {/* Header */}
      <div
        className="sticky top-0 z-10 bg-rw-card border-b border-rw-border
                   px-5 py-4 flex items-center justify-between"
      >
        <button
          onClick={() => navigate(-1)}
          className="text-rw-sub text-2xl"
        >
          →
        </button>

        <div className="flex flex-col items-center">
          <h1 className="font-bold text-rw-title text-base">
            {partnerName}
          </h1>

          <span className="text-rw-green text-xs">
            שיתוף פעולה פעיל
          </span>
        </div>

        <div className="w-6" />
      </div>

      {/* Chat */}
      <div className="flex-1 px-4 py-5 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 gap-2">
            <span className="text-5xl">💬</span>

            <p className="font-bold text-rw-title text-base">
              התחל/י את השיחה!
            </p>

            <p className="text-rw-sub text-sm text-center">
              זה המקום לתאם פרטים ולדבר על שיתוף הפעולה
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((msg, index) => {
              const isMine =
                (isOrg && msg.sender === "org") ||
                (!isOrg && msg.sender === "shop");

              return (
                <div
                  key={index}
                  className={`flex ${
                    isMine ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      isMine
                        ? "bg-rw-btn text-white"
                        : "bg-rw-card border border-rw-border text-rw-title"
                    }`}
                  >
                    <p className="text-xs font-semibold mb-1">
                      {msg.senderName}
                    </p>

                    <p className="text-sm whitespace-pre-wrap">
                      {msg.text}
                    </p>

                    <p
                      className={`text-[10px] mt-1 ${
                        isMine
                          ? "text-white/70"
                          : "text-rw-sub"
                      }`}
                    >
                      {msg.date}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pickup details – org only */}
      {isOrg && (
        <div className="px-4 pb-3">
          <div className="bg-rw-card border border-rw-border rounded-2xl p-4">
            <p className="font-semibold text-rw-title text-sm text-right mb-2">
              פרטי איסוף
            </p>

            <textarea
              value={pickupDetails}
              onChange={(e) =>
                setPickupDetails(e.target.value)
              }
              placeholder="לדוגמה: ניתן לאסוף ביום שלישי בין 10:00–14:00"
              rows={2}
              className="w-full border border-rw-border rounded-xl px-3 py-2
                         bg-rw-input text-sm text-right outline-none
                         focus:border-rw-btn resize-none"
            />

            <button
              onClick={handleSendPickupDetails}
              className="w-full mt-2 bg-rw-btn/10 text-rw-btn
                         border border-rw-btn/30 rounded-xl py-2.5
                         text-xs font-semibold active:bg-rw-btn/20"
            >
              שלח/י פרטי איסוף לחנות
            </button>
          </div>
        </div>
      )}

      {/* Message input */}
      <div className="sticky bottom-0 bg-rw-card border-t border-rw-border px-4 py-3">
        <div className="flex items-end gap-2">

          <button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="w-11 h-11 bg-rw-btn text-white rounded-xl
                       flex items-center justify-center text-lg
                       disabled:opacity-40 shrink-0"
          >
            ➤
          </button>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey
              ) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={`כתוב/י הודעה ל${partnerName}...`}
            rows={1}
            className="flex-1 border border-rw-border rounded-xl px-4 py-3
                       bg-rw-input text-sm text-right outline-none
                       focus:border-rw-btn resize-none"
          />

        </div>
      </div>

    </PageContainer>
  );
}