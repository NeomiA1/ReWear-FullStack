import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { getCauses, saveUserCauses } from "../../services/causesService";

export default function RegisterCausesPage() {
  const { user } = useUser();
  const navigate = useNavigate();

  const [causes,   setCauses]   = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState(null);

  const loadCauses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCauses();
      setCauses(data);
    } catch (err) {
      setError(typeof err === "string" ? err : "שגיאה בטעינת הנושאים");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCauses();
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
    if (!user?.userId) {
      navigate("/home");
      return;
    }
    setSaving(true);
    try {
      await saveUserCauses(user.userId, [...selected]);
      navigate("/home");
    } catch (err) {
      setError(typeof err === "string" ? err : "שגיאה בשמירת הנושאים");
      setSaving(false);
    }
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
        בחר את הנושאים שקרובים לליבך כדי שנוכל להתאים לך עמותות
      </p>

      <div className="bg-rw-card rounded-2xl shadow-sm p-6">

        {loading && (
          <p className="text-sm text-rw-sub text-center py-8">טוען נושאים...</p>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center gap-3 py-6">
            <p className="text-sm text-red-500 text-center">{error}</p>
            <button onClick={loadCauses}
              className="text-sm text-rw-green font-semibold">
              נסה שוב
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-2 gap-3">
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
        <button onClick={handleSave} disabled={saving || loading}
          className="w-full bg-rw-btn text-white rounded-xl py-3
                     text-sm font-semibold active:bg-rw-btn-hover
                     disabled:opacity-60">
          {saving ? "שומר..." : "שמור והמשך"}
        </button>

        <button onClick={handleSkip} disabled={saving}
          className="w-full bg-rw-card border border-rw-border text-rw-sub rounded-xl py-3
                     text-sm font-semibold active:bg-rw-input disabled:opacity-60">
          דלג
        </button>
      </div>

    </div>
  );
}
