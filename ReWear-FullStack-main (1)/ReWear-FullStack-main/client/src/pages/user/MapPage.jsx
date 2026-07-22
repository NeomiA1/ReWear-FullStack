import { useState } from "react";
import { useNavigate } from "react-router-dom";

const MOCK_ORGS = [
  { id: 1, name: "ויצו",     city: "תל אביב",  types: "בגדי נשים, ילדים",  area: "מרכז" },
  { id: 2, name: "נעמת",     city: "חיפה",     types: "כל סוגי הבגדים",    area: "צפון" },
  { id: 3, name: "לתת",      city: "ירושלים",  types: "בגדי חורף, מעילים", area: "ירושלים" },
  { id: 4, name: "יד שרה",   city: "באר שבע",  types: "בגדים לקשישים",    area: "דרום" },
  { id: 5, name: "קרן חיים", city: "רמת גן",   types: "בגדי ילדים",        area: "מרכז" },
];

export default function MapPage() {

  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filteredOrgs = MOCK_ORGS.filter(org =>
    org.name.toLowerCase().includes(search.toLowerCase())
  );

  // פתיחת Google Maps בדפדפן עם חיפוש עמותות בגדים
  const openGoogleMaps = () => {
    window.open(
      "https://www.google.com/maps/search/עמותות+בגדים+קרוב+אליי",
      "_blank"
    );
  };

  // פתיחת Google Maps עם מיקום המשתמש
  const openMyLocation = () => {
    if (!navigator.geolocation) {
      alert("הדפדפן לא תומך במיקום");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        window.open(
          `https://www.google.com/maps/search/עמותות+בגדים/@${latitude},${longitude},14z`,
          "_blank"
        );
      },
      () => alert("לא ניתן לקבל מיקום")
    );
  };

  return (
    <div className="min-h-screen bg-rw-bg pb-10 overflow-y-auto">

      {/* כותרת */}
      <div className="sticky top-0 bg-rw-bg z-10
                      flex items-center justify-between
                      px-5 py-4 border-b border-rw-border">
        <button onClick={() => navigate("/profile")} className="text-rw-sub text-2xl">
          →
        </button>
        <h1 className="font-bold text-rw-title text-base">עמותות באזורך</h1>
        <div className="w-6"></div>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-4">

        {/* כפתורי מפה */}
        <div className="bg-rw-card rounded-2xl shadow-sm p-5 flex flex-col gap-3">
          <p className="text-rw-title font-semibold text-sm text-right">
            חפשי עמותות על המפה
          </p>

          {/* כפתור מיקום שלי */}
          <button
            onClick={openMyLocation}
            className="w-full bg-rw-btn text-white rounded-xl py-3
                       text-sm font-semibold flex items-center justify-center gap-2
                       active:bg-rw-btn-hover"
          >
            <span>📍</span>
            <span>עמותות קרוב אליי</span>
          </button>

          {/* כפתור חיפוש כללי */}
          <button
            onClick={openGoogleMaps}
            className="w-full bg-rw-card border border-rw-border
                       text-rw-title rounded-xl py-3
                       text-sm font-semibold flex items-center justify-center gap-2
                       active:bg-rw-input"
          >
            <span>🗺️</span>
            <span>פתחי Google Maps</span>
          </button>

        </div>

        {/* חיפוש */}
        <input
          type="text"
          placeholder="חיפוש לפי שם עמותה..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-rw-border rounded-xl px-4 py-2.5
                     text-sm text-right outline-none bg-rw-card
                     focus:border-rw-btn w-full"
        />

        {/* רשימת עמותות */}
        <div className="flex flex-col gap-3">
          {filteredOrgs.map((org) => (
            <div
              key={org.id}
              className="bg-rw-card rounded-2xl shadow-sm p-4
                         flex items-center justify-between"
            >
              <button
                onClick={() => window.open(
                  `https://www.google.com/maps/search/${org.name}+${org.city}`,
                  "_blank"
                )}
                className="bg-rw-btn text-white rounded-xl px-3 py-2
                           text-xs font-semibold active:bg-rw-btn-hover"
              >
                במפה
              </button>

              <div className="flex flex-col items-end gap-1">
                <span className="font-semibold text-rw-title text-sm">{org.name}</span>
                <span className="text-xs text-rw-sub">📍 {org.city} · {org.area}</span>
                <span className="text-xs text-rw-sub">{org.types}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}