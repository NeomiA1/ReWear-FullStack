import { useNavigate } from "react-router-dom";
import AssociationRecommendationList from "../../components/AssociationRecommendationList";
import PageContainer from "../../components/PageContainer";
import { useToast } from "../../hooks/useToast";

export default function MapPage() {

  const navigate = useNavigate();
  const toast = useToast();

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
      toast.error("הדפדפן לא תומך במיקום");
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
      () => toast.error("לא ניתן לקבל מיקום")
    );
  };

  return (
    <PageContainer className="pb-10 overflow-y-auto" wide>

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
            חפש/י עמותות על המפה
          </p>

          {/* כפתור מיקום שלי */}
          <button
            onClick={openMyLocation}
            className="w-full bg-rw-btn text-white rounded-xl py-3
                       text-sm font-semibold flex items-center justify-center gap-2
                       active:bg-rw-btn-hover"
          >
            <span>📍</span>
            <span>עמותות קרובות אליי</span>
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
            <span>פתח/י Google Maps</span>
          </button>

        </div>

        {/* רשימת עמותות מומלצות — אותו מנוע ואותם פילטרים כמו ב-ProfilePage */}
        <AssociationRecommendationList
          bag={null}
          renderAction={(org) => (
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
          )}
        />

      </div>
    </PageContainer>
  );
}