import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { CAUSES } from "../../data/associations";
import { saveOnboardingCauses } from "../../utils/recommendationHistory";

// שלב onboarding, מיד אחרי הרשמת משתמש פרטי (RegisterPrivatePage) ולפני
// המעבר לדף הבית. הבחירה נשמרת צד-לקוח בלבד (recommendationHistory.js,
// לפי userId) ומוזנת מיד למנוע ההמלצות — אין קריאת שרת כאן.
export default function RegisterCausesPage() {
  const { user } = useUser();
  const navigate = useNavigate();

  const [selected, setSelected] = useState(() => new Set());

  const toggle = (causeId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(causeId)) next.delete(causeId);
      else next.add(causeId);
      return next;
    });
  };

  const handleSave = () => {
    if (user?.userId != null) {
      saveOnboardingCauses(user.userId, [...selected]);
    }
    navigate("/home");
  };

  const handleSkip = () => navigate("/home");

  return (
    <div className="min-h-screen bg-rw-bg overflow-y-auto px-6 py-8">

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
        בחרי את הנושאים שקרובים לליבך כדי שנוכל להמליץ לך על עמותות מתאימות
      </p>

      <div className="bg-rw-card rounded-2xl shadow-sm p-6">
        <div className="grid grid-cols-2 gap-3">
          {CAUSES.map((cause) => {
            const isSelected = selected.has(cause.id);
            return (
              <button
                key={cause.id}
                onClick={() => toggle(cause.id)}
                className={`rounded-xl px-4 py-3 text-sm text-right border transition-colors
                  ${isSelected
                    ? "bg-rw-btn text-white border-rw-btn"
                    : "bg-rw-input text-rw-title border-rw-border"}`}>
                {cause.label}
              </button>
            );
          })}
        </div>
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

    </div>
  );
}
