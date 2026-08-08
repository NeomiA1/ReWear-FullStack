import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { getAllCauses, saveUserCauses } from "../../services/causesService";
import { saveOnboardingCauses } from "../../utils/recommendationHistory";
import AuthLayout from "../../components/AuthLayout";

// שלב onboarding, מיד אחרי הרשמת משתמש פרטי (RegisterPrivatePage) ולפני
// המעבר לדף הבית. הבחירה נשמרת גם בשרת (UserCauses, מקור האמת) וגם
// ב-localStorage (recommendationHistory.js) כקלט מיידי למנוע ההמלצות.
export default function RegisterCausesPage() {
  const { user } = useUser();
  const navigate = useNavigate();

  const [causes, setCauses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(() => new Set());

  useEffect(() => {
    let cancelled = false;
    getAllCauses()
      .then((data) => {
        if (!cancelled) setCauses(data);
      })
      .catch(() => {
        // רשימה ריקה = פשוט לא יוצגו כפתורים; "דלג" עדיין עובד.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (causeId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(causeId)) next.delete(causeId);
      else next.add(causeId);
      return next;
    });
  };

  const handleSave = async () => {
    const causeIds = [...selected];
    if (user?.userId != null) {
      saveOnboardingCauses(user.userId, causeIds);
      try {
        await saveUserCauses(user.userId, causeIds);
      } catch {
        // best-effort סנכרון לשרת — localStorage כבר מזין את מנוע ההמלצות,
        // אונבורדינג לא צריך להיחסם על תקלת רשת כאן.
      }
    }
    navigate("/home");
  };

  const handleSkip = () => navigate("/home");

  return (
    <AuthLayout wide>

      {/* לוגו */}
      <div className="w-14 h-14 rounded-2xl bg-rw-logo flex items-center
                      justify-center mx-auto mb-4">
        <span className="text-white text-xl font-bold">R</span>
      </div>

      {/* כותרת */}
      <h1 className="text-xl font-bold text-rw-title text-center mb-2">
        מה חשוב לך לתרום?
      </h1>
      <p className="text-sm text-rw-sub text-center mb-6">
        בחר/י את הנושאים שקרובים לליבך כדי שנוכל להמליץ לך על עמותות מתאימות
      </p>

      <div className="bg-rw-card rounded-2xl shadow-sm p-6">
        {loading ? (
          <p className="text-rw-sub text-sm text-center">טוען נושאים...</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {causes.map((cause) => {
              const isSelected = selected.has(cause.causeId);
              return (
                <button
                  key={cause.causeId}
                  onClick={() => toggle(cause.causeId)}
                  className={`rounded-xl px-4 py-3 text-sm text-right border transition-colors
                    ${isSelected
                      ? "bg-rw-btn text-white border-rw-btn"
                      : "bg-rw-input text-rw-title border-rw-border"}`}>
                  {cause.labelHe}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* כפתורים */}
      <div className="flex flex-col gap-3 mt-6">
        <button onClick={handleSave}
          className="w-full bg-rw-btn text-white rounded-xl py-3
                     text-sm font-semibold active:bg-rw-btn-hover">
          שמור והמשך
        </button>

        <button onClick={handleSkip}
          className="w-full bg-rw-card border border-rw-border text-rw-sub rounded-xl py-3
                     text-sm font-semibold active:bg-rw-input">
          דלג
        </button>
      </div>

    </AuthLayout>
  );
}