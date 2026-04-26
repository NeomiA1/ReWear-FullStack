import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import BottomNav from "../../components/BottomNav";

const MOCK_ORGS = [
  { id: 1, name: "ויצו",     city: "תל אביב",  types: "בגדי נשים, ילדים",  area: "מרכז" },
  { id: 2, name: "נעמת",     city: "חיפה",     types: "כל סוגי הבגדים",    area: "צפון" },
  { id: 3, name: "לתת",      city: "ירושלים",  types: "בגדי חורף, מעילים", area: "ירושלים" },
  { id: 4, name: "יד שרה",   city: "באר שבע",  types: "בגדים לקשישים",    area: "דרום" },
  { id: 5, name: "קרן חיים", city: "רמת גן",   types: "בגדי ילדים",        area: "מרכז" },
];

export default function ProfilePage() {

  const navigate = useNavigate();

  // הוספנו getOrgSettings לשליפת הגדרות עמותה
  const { user, donations, sendDonationToOrg, logout, getOrgSettings } = useUser();

  const [selectedBag, setSelectedBag]   = useState(null);
  const [selectedOrg, setSelectedOrg]   = useState(null);
  const [search, setSearch]             = useState("");
  const [sent, setSent]                 = useState(false);

  const filteredOrgs = MOCK_ORGS.filter(org =>
    org.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSendToOrg = () => {
    if (!selectedBag || !selectedOrg) return;
    sendDonationToOrg(selectedBag, selectedOrg);
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setSelectedBag(null);
      setSelectedOrg(null);
    }, 3000);
  };

  if (!user) {
    navigate("/");
    return null;
  }

  const allBags = donations.flatMap(donation =>
    donation.bags.map(bag => ({
      ...bag,
      donationDate: donation.date,
      donationId: donation.id
    }))
  );

  return (
    <div className="min-h-screen bg-rw-bg pb-28 overflow-y-auto">

      {/* ── כותרת ── */}
      <div className="bg-rw-card px-5 pt-8 pb-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={logout}
            className="text-xs text-rw-sub border border-rw-border
                       rounded-xl px-3 py-1.5 active:bg-rw-input"
          >
            התנתקות
          </button>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <h1 className="font-bold text-rw-title text-lg">{user.fullName}</h1>
              <p className="text-rw-sub text-sm">{user.email}</p>
              {user.location && (
                <p className="text-rw-sub text-xs mt-0.5">📍 {user.location}</p>
              )}
            </div>
            <div className="w-16 h-16 rounded-full bg-rw-logo
                            flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {user.fullName.charAt(0)}
              </span>
            </div>
          </div>
        </div>

        {/* סטטיסטיקות */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-rw-input rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-rw-title">
              {donations.reduce((t, d) => t + d.bags.length, 0)}
            </p>
            <p className="text-xs text-rw-sub mt-1">שקים שנתרמו</p>
          </div>
          <div className="bg-rw-input rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-rw-title">{donations.length}</p>
            <p className="text-xs text-rw-sub mt-1">תרומות שנשלחו</p>
          </div>
        </div>
      </div>

      <div className="px-5 mt-5 flex flex-col gap-6">

        {/* ── הודעת הצלחה ── */}
        {sent && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4
                          flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-semibold text-green-700 text-sm">
                התרומה נשלחה בהצלחה!
              </p>
              <p className="text-green-600 text-xs mt-0.5">
                {selectedOrg?.name} תיצור איתך קשר בקרוב
              </p>
            </div>
          </div>
        )}

        {/* ── שלב 1: בחירת שק ── */}
        <div>
          <h2 className="font-bold text-rw-title text-base mb-3">
            שלב 1 – בחרי שק לשליחה
          </h2>

          {allBags.length === 0 ? (
            <div className="bg-rw-card rounded-2xl p-5 text-center shadow-sm">
              <p className="text-3xl mb-2">🛍️</p>
              <p className="text-rw-sub text-sm">עדיין לא העלית שקים</p>
              <button
                onClick={() => navigate("/upload")}
                className="mt-3 bg-rw-btn text-white rounded-xl px-4 py-2
                           text-sm font-semibold"
              >
                העלי שק
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {allBags.map((bag, index) => (
                <div
                  key={`${bag.donationId}-${bag.id}`}
                  onClick={() => setSelectedBag(bag)}
                  className={`bg-rw-card rounded-2xl p-4 shadow-sm
                             flex items-center justify-between cursor-pointer
                             border-2 transition-all
                             ${selectedBag?.id === bag.id &&
                               selectedBag?.donationId === bag.donationId
                               ? "border-rw-btn"
                               : "border-transparent"}`}
                >
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-semibold text-rw-title text-sm">
                      שק {index + 1}
                    </span>
                    <span className="text-xs text-rw-sub">
                      {[bag.size, bag.gender, bag.condition]
                        .filter(Boolean).join(" · ")}
                    </span>
                    <span className="text-xs text-rw-sub">{bag.donationDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedBag?.id === bag.id &&
                     selectedBag?.donationId === bag.donationId && (
                      <span className="text-rw-btn text-lg">✓</span>
                    )}
                    <span className="text-2xl">🛍️</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── שלב 2: בחירת עמותה ── */}
        <div>
          <h2 className="font-bold text-rw-title text-base mb-3">
            שלב 2 – בחרי עמותה
          </h2>

          {/* חיפוש + מפה */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="חיפוש לפי שם עמותה..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 border border-rw-border rounded-xl px-4 py-2.5
                         text-sm text-right outline-none bg-rw-card
                         focus:border-rw-btn"
            />
            <button
              onClick={() => navigate("/map")}
              className="bg-rw-card border border-rw-border rounded-xl px-3
                         flex items-center gap-1 text-rw-sub text-sm
                         active:bg-rw-input"
            >
              <span>🗺️</span>
              <span>מפה</span>
            </button>
          </div>

          {/* ── רשימת עמותות עם סטטוס ── */}
          <div className="flex flex-col gap-3">
            {filteredOrgs.map((org) => {

              // שולפים הגדרות של כל עמותה מה-Context
              const settings = getOrgSettings(org.name);

              return (
                <div
                  key={org.id}
                  onClick={() => setSelectedOrg(org)}
                  className={`bg-rw-card rounded-2xl shadow-sm p-4
                             flex flex-col gap-2 cursor-pointer
                             border-2 transition-all
                             ${selectedOrg?.id === org.id
                               ? "border-rw-btn"
                               : "border-transparent"}`}
                >
                  {/* שורה עליונה: שם + סימון בחירה */}
                  <div className="flex items-center justify-between">
                    {selectedOrg?.id === org.id && (
                      <span className="text-rw-btn text-lg">✓</span>
                    )}
                    <span className="font-semibold text-rw-title text-sm">
                      {org.name}
                    </span>
                  </div>

                  {/* מיקום */}
                  <span className="text-xs text-rw-sub text-right">
                    📍 {org.city} · {org.area}
                  </span>

                  {/* סוגי תרומות */}
                  <span className="text-xs text-rw-sub text-right">
                    {org.types}
                  </span>

                  {/* ── סטטוס זמינות ואופן קבלה ── */}
                  <div className="flex flex-wrap gap-2 justify-end mt-1">

                    {/* סטטוס זמינות */}
                    <span className={`text-xs px-2 py-1 rounded-full font-medium
                      ${settings.isAvailable
                        ? "bg-green-50 text-green-600"
                        : "bg-red-50 text-red-400"}`}>
                      {settings.isAvailable
                        ? "✓ זמינה לתרומות"
                        : "✗ לא זמינה כרגע"}
                    </span>

                    {/* איסוף מהבית */}
                    {settings.acceptsPickup && (
                      <span className="text-xs px-2 py-1 rounded-full
                                       bg-blue-50 text-blue-500 font-medium">
                        🚗 איסוף מהבית
                      </span>
                    )}

                    {/* הגעה לעמותה */}
                    {settings.acceptsDropoff && (
                      <span className="text-xs px-2 py-1 rounded-full
                                       bg-purple-50 text-purple-500 font-medium">
                        🏢 הגעה לעמותה
                      </span>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── כפתור שליחה ── */}
        {selectedBag && selectedOrg && !sent && (
          <div className="bg-rw-card rounded-2xl shadow-sm p-4">
            <div className="flex flex-col gap-1 mb-4 items-end">
              <p className="text-sm text-rw-title font-semibold">סיכום:</p>
              <p className="text-xs text-rw-sub">
                שק: {[selectedBag.size, selectedBag.gender, selectedBag.condition]
                  .filter(Boolean).join(" · ")}
              </p>
              <p className="text-xs text-rw-sub">
                עמותה: {selectedOrg.name} – {selectedOrg.city}
              </p>
            </div>
            <button
              onClick={handleSendToOrg}
              className="w-full bg-rw-btn text-white rounded-xl py-3
                         text-sm font-semibold flex items-center justify-center gap-2
                         active:bg-rw-btn-hover"
            >
              <span>📦</span>
              <span>שלחי תרומה ל{selectedOrg.name}</span>
            </button>
          </div>
        )}

      </div>

      <BottomNav active="profile" />
    </div>
  );
}