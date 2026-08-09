import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import OrgBottomNav from "../../components/OrgBottomNav";
import PageContainer from "../../components/PageContainer";
import { checkAssociationExists } from "../../services/associationService";
import { getNearbyStores } from "../../services/storeService";
import {
  sendCollaborationRequest,
  getAssociationCollaborationRequests
} from "../../services/collaborationService";
import { useToast } from "../../hooks/useToast";
import { useNotifications } from "../../hooks/useNotifications";
import { getCollabStatusInfo } from "../../utils/statusLabels";

const DEMO_STORES = [
  { id: 1, name: "חנות חמד",      city: "חיפה",    items: "בגדים ונעליים"         },
  { id: 2, name: "יד שנייה בטוב", city: "תל אביב", items: "ציוד תינוקות"          },
  { id: 3, name: "מסע בזמן",      city: "ירושלים", items: "בגדים, ספרים, כלי בית" },
  { id: 4, name: "החנות הירוקה",  city: "נתניה",   items: "בגדי ילדים"            },
];

export default function OrgHomePage() {
  const navigate = useNavigate();
  const { user, logout, sentDonations,
           getUrgentNeeds, updateUrgentNeeds } = useUser();
  const toast = useToast();
  const { unreadCount } = useNotifications();

  const [selectedStore, setSelectedStore] = useState(null);
  const [searchQuery,   setSearchQuery]   = useState("");

  const savedUser = JSON.parse(localStorage.getItem("rewear_user") || "{}");
  const orgName   = user?.orgName || savedUser?.orgName || 'עמותת "לב חם"';

  const [urgentNeeds, setUrgentNeedsState] = useState(() => getUrgentNeeds(orgName));
  const [isEditing,   setIsEditing]   = useState(false);
  const [editText,    setEditText]    = useState("");

  const handleAddNeed = () => {
    if (!editText.trim()) return;
    const next = [...urgentNeeds, {
      id:          Date.now(),
      title:       editText.trim(),
      description: "",
      icon:        "📌",
    }];
    setUrgentNeedsState(next);
    updateUrgentNeeds(orgName, next);
    setEditText("");
    setIsEditing(false);
  };

  const handleDeleteNeed = (id) => {
    const next = urgentNeeds.filter(n => n.id !== id);
    setUrgentNeedsState(next);
    updateUrgentNeeds(orgName, next);
  };

  const handleSendCollabRequest = async (store) => {
    try {
      await sendCollaborationRequest(store.id);
      await refreshCollabRequests();
    } catch (err) {
      let message = "כבר נשלחה בקשה לחנות זו";
      try {
        message = JSON.parse(err)?.message || message;
      } catch {
        // err wasn't JSON — keep the default message
      }
      toast.warning(message);
    }
  };

  const [storeList, setStoreList] = useState(DEMO_STORES);
  const [storesSource, setStoresSource] = useState("demo"); // "demo" | "real"
  const [loadingStores, setLoadingStores] = useState(true);
  const [storesError, setStoresError] = useState(null);
  const [myCollabRequests, setMyCollabRequests] = useState([]);

  const refreshCollabRequests = async () => {
    if (!user?.userId) return;
    try {
      const requests = await getAssociationCollaborationRequests(user.userId);
      setMyCollabRequests(requests);
    } catch {
      // best-effort — leave the list as-is on failure
    }
  };

  useEffect(() => {
    refreshCollabRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId]);

  useEffect(() => {
    let cancelled = false;

    const loadRealStores = async () => {
      setLoadingStores(true);
      setStoresError(null);

      try {

        const realAssociation = await checkAssociationExists(orgName, user?.email || "");

        if (!realAssociation) {
          if (!cancelled) setStoresSource("demo");
          return;
        }

        const realStores = await getNearbyStores(realAssociation.associationId);
        if (cancelled) return;

        if (!realStores || realStores.length === 0) {
          setStoresSource("demo");
        } else {
          setStoreList(realStores.map(s => ({
            id:    s.storeId,
            name:  s.storeName,
            city:  s.city || "",
            items: s.description || s.area || "",
          })));
          setStoresSource("real");
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setStoresError("לא הצלחנו לטעון חנויות מהשרת כרגע. מוצגת רשימת הדגמה.");
          setStoresSource("demo");
        }
      } finally {
        if (!cancelled) setLoadingStores(false);
      }
    };

    loadRealStores();
    return () => { cancelled = true; };
  }, [orgName, user?.email]);

  const donations     = sentDonations || [];
  const totalReceived = donations.filter(d =>
    ["approved","scheduled","collected"].includes(d.status)
  ).length;
  const pendingRequests = donations.filter(d => d.status === "pending").length;

  const KPI_DATA = [
    {
      id: 1,
      label:    "בקשות ממתינות",
      value:    String(pendingRequests),
      change:   pendingRequests > 0 ? `מתוך ${donations.length} בקשות סה״כ` : "אין נתונים עדיין",
      positive: pendingRequests > 0,
      icon:     "⏳",
    },
    {
      id: 2,
      label:    "פריטים שהתקבלו",
      value:    String(totalReceived),
      change:   totalReceived > 0 ? `${donations.length} בקשות סה״כ` : "אין נתונים עדיין",
      positive: totalReceived > 0,
      icon:     "📦",
    },
  ];

  return (
    <PageContainer className="pb-24 overflow-y-auto" wide>

      {/* Header */}
      <div className="bg-rw-card px-5 pt-6 pb-4 shadow-sm
                      flex items-center justify-between">
        <button onClick={() => { logout(); navigate("/"); }}
          className="text-xs text-rw-sub border border-rw-border
                     rounded-xl px-3 py-1.5 active:bg-rw-input shrink-0">
          התנתקות
        </button>
        <div className="flex flex-col items-end flex-1 mx-3">
          <h1 className="font-bold text-rw-title text-base">{orgName}</h1>
          <p className="text-rw-sub text-xs mt-0.5">סיוע לנשים במצבי סיכון</p>
        </div>
        <div onClick={() => navigate("/org/notifications")}
          className="relative w-10 h-10 bg-rw-input rounded-xl
                     flex items-center justify-center cursor-pointer shrink-0">
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

        {/* ── לוח בקרה – KPI מחושב מ-Context ── */}
        <div>
          <h2 className="font-bold text-rw-title text-base mb-3">לוח בקרה</h2>
          <div className="grid grid-cols-2 gap-4">
            {KPI_DATA.map((kpi) => (
              <div key={kpi.id}
                className="bg-rw-card rounded-2xl p-4 shadow-sm flex flex-col items-end gap-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-rw-sub">{kpi.label}</span>
                  <span className="text-xl">{kpi.icon}</span>
                </div>
                <span className="text-2xl font-bold text-rw-title">{kpi.value}</span>
                <span className={`text-xs font-medium
                  ${kpi.positive ? "text-green-500" : "text-rw-sub"}`}>
                  {kpi.change}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── צרכים דחופים – ניתנים לעריכה ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setIsEditing(prev => !prev)}
              className="text-rw-green text-sm cursor-pointer">
              {isEditing ? "✕ סגור" : "✏️ עריכה"}
            </button>
            <h2 className="font-bold text-rw-title text-base">צרכים דחופים</h2>
          </div>

          {/* שדה הוספה */}
          {isEditing && (
            <div className="flex gap-2 mb-3">
              <button onClick={handleAddNeed}
                className="bg-rw-btn text-white rounded-xl px-4 py-2
                           text-xs font-semibold shrink-0 active:bg-rw-btn-hover">
                הוסף/י
              </button>
              <input type="text" value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddNeed()}
                placeholder="הוסף/י צורך דחוף חדש..."
                dir="rtl"
                className="flex-1 border border-rw-border rounded-xl px-4 py-2
                           text-sm text-right outline-none bg-rw-input
                           focus:border-rw-btn" />
            </div>
          )}

          <div className="flex flex-col gap-3 md:grid md:grid-cols-2 xl:grid-cols-3 md:items-start">
            {urgentNeeds.length === 0 ? (
              <div className="bg-rw-card rounded-2xl p-4 text-center shadow-sm">
                <p className="text-rw-title text-sm font-semibold">עדיין לא הוגדרו צרכים דחופים</p>
                <p className="text-rw-sub text-xs mt-1">
                  ניתן להוסיף צרכים כדי לעזור לתורמים לדעת מה הכי נחוץ כרגע
                </p>
              </div>
            ) : urgentNeeds.map((need) => (
              <div key={need.id}
                className="bg-rw-card rounded-2xl shadow-sm p-4
                           flex items-center justify-between">
                {isEditing && (
                  <button onClick={() => handleDeleteNeed(need.id)}
                    className="text-red-400 text-xl shrink-0">
                    🗑️
                  </button>
                )}
                <div className="flex flex-col items-end gap-1 flex-1">
                  <span className="font-semibold text-rw-title text-sm">{need.title}</span>
                  {need.description && (
                    <span className="text-rw-sub text-xs">{need.description}</span>
                  )}
                </div>
                <div className="w-10 h-10 bg-rw-input rounded-xl flex items-center justify-center mr-3">
                  <span className="text-xl">{need.icon}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── שיתוף פעולה עם חנות יד שנייה ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            {selectedStore ? (
              <button onClick={() => setSelectedStore(null)}
                className="text-rw-green text-sm font-semibold">
                החלף חנות
              </button>
            ) : <span />}
            <h2 className="font-bold text-rw-title text-base">
              שיתוף פעולה עם חנות יד שנייה
            </h2>
          </div>

          {selectedStore ? (
            <div className="bg-rw-card rounded-2xl shadow-sm p-4
                            flex items-center justify-between border border-rw-green/40">
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs text-rw-sub mb-0.5">החנות שנבחרה לשיתוף פעולה</span>
                <span className="font-bold text-rw-title text-sm">{selectedStore.name}</span>
                <span className="text-rw-sub text-xs">{selectedStore.city}</span>
                <span className="text-rw-green text-xs font-medium">{selectedStore.items}</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 bg-rw-green/10 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🤝</span>
                </div>
                <span className="text-rw-green text-[10px] font-bold">פעיל</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">

              {loadingStores && (
                <div className="bg-rw-card rounded-2xl p-4 text-center shadow-sm">
                  <p className="text-2xl mb-1">⏳</p>
                  <p className="text-rw-sub text-xs">מחפש/ת חנויות אמיתיות בקרבתך...</p>
                  <p className="text-rw-sub text-[10px] mt-1">
                    אם זו הפעם הראשונה היום, זה עשוי לקחת עד 30 שניות
                  </p>
                </div>
              )}

              {!loadingStores && storesError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                  <p className="text-red-600 text-xs text-right">{storesError}</p>
                </div>
              )}

              {!loadingStores && storesSource === "demo" && !storesError && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2">
                  <p className="text-amber-600 text-[11px] text-right">
                    מוצגת רשימת הדגמה — עמותה זו טרם רשומה במערכת האמיתית, או שאין
                    חנויות אמיתיות רשומות בקרבתה כרגע
                  </p>
                </div>
              )}

              <div className="bg-rw-card rounded-2xl shadow-sm px-4 py-2
                              flex items-center gap-2 border border-rw-border">
                <span className="text-rw-sub text-base">🔍</span>
                <input type="text" value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="חיפוש לפי שם, עיר או סוג פריטים..."
                  className="flex-1 bg-transparent text-sm text-rw-title
                             placeholder:text-rw-sub outline-none text-right"
                  dir="rtl" />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")}
                    className="text-rw-sub text-lg leading-none">✕</button>
                )}
              </div>

              {storeList.filter((store) => {
                const q = searchQuery.trim().toLowerCase();
                if (!q) return true;
                return store.name.toLowerCase().includes(q) ||
                       store.city.toLowerCase().includes(q) ||
                       store.items.toLowerCase().includes(q);
              }).map((store) => {
                const existing = myCollabRequests.find(
                  c => c.storeId === store.id && c.requestStatus !== "Rejected"
                );
                // DB status word is "Accepted" (CHK_AssociationStoreRequests_request_status
                // doesn't allow "Approved") -- translated here to match this page's
                // existing "approved" terminology.
                const rawExistingStatus = existing?.requestStatus?.toLowerCase();
                const existingStatus =
                  rawExistingStatus === "accepted" ? "approved" : rawExistingStatus;
                return (
                  <div key={store.id}
                    className="bg-rw-card rounded-2xl shadow-sm p-4
                               flex items-center justify-between">
                    {existingStatus === "approved" ? (
                      <button onClick={() => navigate(`/org/chat/${existing.collaborationRequestId}`)}
                        className="bg-rw-btn/10 text-rw-btn border border-rw-btn/30
                                   rounded-xl px-3 py-2 text-xs font-semibold
                                   whitespace-nowrap shrink-0 flex items-center gap-1">
                        <span>💬</span><span>צ׳אט</span>
                      </button>
                    ) : existingStatus === "pending" ? (
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0
                                       ${getCollabStatusInfo("pending").color}`}>
                        {getCollabStatusInfo("pending").label}
                      </span>
                    ) : (
                      <button onClick={() => handleSendCollabRequest(store)}
                        className="bg-rw-btn text-white rounded-xl px-3 py-2
                                   text-xs font-semibold active:bg-rw-btn-hover
                                   whitespace-nowrap shrink-0">
                        שלח/י בקשת שיתוף
                      </button>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="font-semibold text-rw-title text-sm">{store.name}</span>
                        <span className="text-rw-sub text-xs">{store.city}</span>
                        <span className="text-rw-green text-xs font-medium">{store.items}</span>
                      </div>
                      <div className="w-10 h-10 bg-rw-input rounded-xl
                                      flex items-center justify-center shrink-0">
                        <span className="text-xl">🏪</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {storeList.filter((store) => {
                const q = searchQuery.trim().toLowerCase();
                if (!q) return true;
                return store.name.toLowerCase().includes(q) ||
                       store.city.toLowerCase().includes(q) ||
                       store.items.toLowerCase().includes(q);
              }).length === 0 && (
                <div className="bg-rw-card rounded-2xl shadow-sm p-6
                                flex flex-col items-center gap-2">
                  <span className="text-3xl">🔍</span>
                  <p className="text-rw-sub text-sm text-center">
                    לא נמצאו חנויות עבור &ldquo;{searchQuery}&rdquo;
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      <OrgBottomNav active="home" />
    </PageContainer>
  );
}