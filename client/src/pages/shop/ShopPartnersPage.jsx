

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import ShopBottomNav from "../../components/ShopBottomNav";
import PageContainer from "../../components/PageContainer";
import { getCollabStatusInfo } from "../../utils/statusLabels";
import {
  getStoreCollaborationRequests,
  respondToCollaborationRequest
} from "../../services/collaborationService";
import {
  getStoreCollectionOffers,
  respondToCollectionOffer
} from "../../services/donationRequestService";

// variant prop kept minimal on purpose: onChat missing => no chat button
// (collection offers have no chat step), approveLabel lets the button text
// fit both "approve a partnership" and "accept a pickup" without a second
// component -- evaluated a dedicated CollectionOfferCard and decided the
// data/actions overlap too much to justify one.
function CollabCard({ collab, onApprove, onReject, onChat, approveLabel = "אשר שיתוף פעולה" }) {
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
            {approveLabel}
          </button>
        </div>
      ) : collab.status === "approved" && onChat ? (
        <button onClick={() => onChat(collab.id)}
          className="w-full bg-rw-btn/10 text-rw-btn border border-rw-btn/30
                     rounded-xl py-2 text-xs font-semibold active:bg-rw-btn/20
                     flex items-center justify-center gap-2">
          <span>💬</span>
          <span>פתח/י צ׳אט עם {collab.orgName}</span>
        </button>
      ) : null}

    </div>
  );
}

function mapCollabRequest(r) {
  // DB status word is "Accepted" (CHK_AssociationStoreRequests_request_status
  // doesn't allow "Approved") -- the existing UI was written expecting
  // "approved", so translate it here rather than touch the UI.
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

function mapCollectionOffer(r) {
  // assignmentStatus is "Offered" | "Accepted" | "Declined" -- mapped onto
  // the same pending/approved/rejected vocabulary CollabCard already
  // understands, so no new status handling is needed anywhere.
  const rawStatus = (r.assignmentStatus || "").toLowerCase();
  const status =
    rawStatus === "offered" ? "pending" :
    rawStatus === "accepted" ? "approved" :
    rawStatus === "declined" ? "rejected" : rawStatus;
  return {
    id: r.requestId,
    orgName: r.associationName,
    orgCity: r.associationCity || "",
    orgTypes: r.associationType || "",
    status,
    date: new Date(r.requestDate).toLocaleDateString("he-IL")
  };
}

const TABS = [
  { id: "partnerships", label: "שיתופי פעולה פעילים" },
  { id: "offers",       label: "בקשות סיוע באיסוף" }
];

export default function ShopPartnersPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("partnerships");
  const [collaborations, setCollaborations] = useState([]);
  const [collectionOffers, setCollectionOffers] = useState([]);

  const loadCollaborations = async () => {
    if (!user?.userId) return;
    try {
      const requests = await getStoreCollaborationRequests(user.userId);
      setCollaborations(requests.map(mapCollabRequest));
    } catch {
      // best-effort — leave the list as-is on failure
    }
  };

  const loadCollectionOffers = async () => {
    if (!user?.userId) return;
    try {
      const offers = await getStoreCollectionOffers(user.userId);
      setCollectionOffers(offers.map(mapCollectionOffer));
    } catch {
      // best-effort
    }
  };

  // Both datasets load on mount regardless of which tab is active, so the
  // second tab's count is already available before it's ever selected.
  useEffect(() => {
    loadCollaborations();
    loadCollectionOffers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId]);

  const pending  = collaborations.filter(c => c.status === "pending");
  const approved = collaborations.filter(c => c.status === "approved");
  const rejected = collaborations.filter(c => c.status === "rejected");

  const offersPending  = collectionOffers.filter(c => c.status === "pending");
  const offersApproved = collectionOffers.filter(c => c.status === "approved");
  const offersRejected = collectionOffers.filter(c => c.status === "rejected");

  const handleApprove = async (id) => {
    await respondToCollaborationRequest(id, "approved");
    await loadCollaborations();
  };
  const handleReject = async (id) => {
    await respondToCollaborationRequest(id, "rejected");
    await loadCollaborations();
  };
  const handleChat = (id) => navigate(`/shop/chat/${id}`);

  const handleAcceptOffer = async (id) => {
    await respondToCollectionOffer(id, "approved");
    await loadCollectionOffers();
  };
  const handleDeclineOffer = async (id) => {
    await respondToCollectionOffer(id, "rejected");
    await loadCollectionOffers();
  };

  return (
    <PageContainer className="pb-24 overflow-y-auto" wide>

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

      {/* טאבים */}
      <div className="flex gap-2 px-5 pt-4">
        {TABS.map(tab => {
          const count = tab.id === "partnerships" ? approved.length : offersPending.length;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 text-center px-3 py-2 rounded-xl text-xs font-semibold
                ${activeTab === tab.id
                  ? "bg-rw-btn text-white"
                  : "bg-rw-input text-rw-sub border border-rw-border"}`}>
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {activeTab === "partnerships" && (
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
      )}

      {activeTab === "offers" && (
        <div className="px-5 pt-5 flex flex-col gap-4">

          {/* ממתינות לתגובה */}
          {offersPending.length > 0 && (
            <div>
              <h2 className="font-bold text-rw-title text-sm mb-3 text-right">
                ממתינות לתגובה ({offersPending.length})
              </h2>
              <div className="flex flex-col gap-3">
                {offersPending.map(c => (
                  <CollabCard key={c.id} collab={c}
                    onApprove={handleAcceptOffer}
                    onReject={handleDeclineOffer}
                    approveLabel="קבל/י איסוף" />
                ))}
              </div>
            </div>
          )}

          {/* אושרו */}
          {offersApproved.length > 0 && (
            <div>
              <h2 className="font-bold text-rw-title text-sm mb-3 text-right">
                אושרו ({offersApproved.length})
              </h2>
              <div className="flex flex-col gap-3">
                {offersApproved.map(c => (
                  <CollabCard key={c.id} collab={c}
                    onApprove={handleAcceptOffer}
                    onReject={handleDeclineOffer}
                    approveLabel="קבל/י איסוף" />
                ))}
              </div>
            </div>
          )}

          {/* אין בקשות */}
          {collectionOffers.length === 0 && (
            <div className="flex flex-col items-center gap-3 pt-16">
              <span className="text-5xl">📦</span>
              <p className="font-bold text-rw-title text-base">אין בקשות סיוע באיסוף</p>
              <p className="text-rw-sub text-sm text-center">
                כשעמותה שותפה תבקש סיוע באיסוף – היא תופיע כאן.
              </p>
            </div>
          )}

          {/* נדחו */}
          {offersRejected.length > 0 && (
            <div className="opacity-50">
              <h2 className="font-bold text-rw-title text-sm mb-3 text-right">
                נדחו ({offersRejected.length})
              </h2>
              <div className="flex flex-col gap-3">
                {offersRejected.map(c => (
                  <CollabCard key={c.id} collab={c}
                    onApprove={handleAcceptOffer}
                    onReject={handleDeclineOffer}
                    approveLabel="קבל/י איסוף" />
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      <ShopBottomNav active="partners" />
    </PageContainer>
  );
}
