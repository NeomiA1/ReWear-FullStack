import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import PageContainer from "../../components/PageContainer";
import { useToast } from "../../hooks/useToast";
import { getDonationBagsByUserId } from "../../services/donationBagService";
import { selectPickupOption } from "../../services/donationRequestService";

export default function PickupSchedulingPage() {
  const navigate = useNavigate();
  const { id }    = useParams();
  const { user }  = useUser();
  const toast     = useToast();

  const [bag,     setBag]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    const loadBag = async () => {
      if (!user?.userId) return;
      setLoading(true);
      setError(null);
      try {
        const bags  = await getDonationBagsByUserId(user.userId);
        const match = (bags || []).find(b => b.requestId === Number(id));
        setBag(match || null);
      } catch (err) {
        console.error(err);
        setError("לא הצלחנו לטעון את פרטי התרומה. בדוק/י את החיבור ונסה/י שוב.");
      } finally {
        setLoading(false);
      }
    };
    loadBag();
  }, [user, id]);

  const [selectedDay,  setSelectedDay]  = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [sending,      setSending]      = useState(false);
  const [sent,         setSent]         = useState(false);

  const handleSubmit = async () => {
    if (!selectedDay || !selectedTime) {
      toast.warning("אנא בחר/י יום ושעה");
      return;
    }
    setSending(true);
    try {
      await selectPickupOption(bag.requestId, selectedDay, selectedTime);
      setSent(true);
    } catch (err) {
      toast.error(typeof err === "string" ? err : "שגיאה בשליחת הבחירה");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-rw-bg flex items-center justify-center px-6">
        <div className="bg-rw-card rounded-2xl p-6 text-center shadow-sm">
          <p className="text-3xl mb-2">⏳</p>
          <p className="text-rw-sub text-sm">טוען פרטי תרומה...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-rw-bg flex items-center justify-center px-6">
        <div className="bg-rw-card rounded-2xl p-6 text-center shadow-sm">
          <p className="text-3xl mb-2">⚠️</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!bag) {
    return (
      <div className="min-h-screen bg-rw-bg flex items-center justify-center px-6">
        <div className="bg-rw-card rounded-2xl p-6 text-center shadow-sm">
          <p className="text-3xl mb-2">⚠️</p>
          <p className="text-rw-title font-semibold mb-1">תרומה לא נמצאה</p>
          <button onClick={() => navigate("/status")}
            className="mt-4 bg-rw-btn text-white rounded-xl px-4 py-2 text-sm">
            חזרה למסע התרומה
          </button>
        </div>
      </div>
    );
  }

  if (!bag.proposedPickupDays) {
    return (
      <div className="min-h-screen bg-rw-bg flex items-center justify-center px-6">
        <div className="bg-rw-card rounded-2xl p-6 text-center shadow-sm">
          <p className="text-3xl mb-3">⏳</p>
          <p className="font-bold text-rw-title mb-1">טרם הוצעו מועדי איסוף</p>
          <p className="text-rw-sub text-sm">
            העמותה עדיין לא הציעה מועדים לאיסוף השק.
          </p>
          <button onClick={() => navigate("/status")}
            className="mt-4 bg-rw-btn text-white rounded-xl px-5 py-2.5 text-sm font-semibold">
            חזרה למסע התרומה
          </button>
        </div>
      </div>
    );
  }

  const availableDays  = bag.proposedPickupDays.split(",");
  const availableTimes = bag.proposedPickupTimes.split(",");
  const bagLabel = [bag.sizes, bag.targetGender, bag.clothesCondition]
    .filter(Boolean).join(" · ") || "שק תרומה";

  const alreadyScheduled = sent || Boolean(bag.selectedPickupDay);
  const scheduledDay  = sent ? selectedDay  : bag.selectedPickupDay;
  const scheduledTime = sent ? selectedTime : bag.selectedPickupTime;

  return (
    <PageContainer className="overflow-y-auto pb-10">

      {/* כותרת */}
      <div className="sticky top-0 bg-rw-bg z-10
                      flex items-center justify-between
                      px-5 py-4 border-b border-rw-border">
        <button onClick={() => navigate(-1)} className="text-rw-sub text-2xl">→</button>
        <h1 className="font-bold text-rw-title text-base">תיאום איסוף</h1>
        <div className="w-6" />
      </div>

      <div className="px-5 pt-5 flex flex-col gap-5">

        {/* הצלחה */}
        {alreadyScheduled ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
            <p className="text-4xl mb-3">✅</p>
            <p className="font-bold text-green-700 text-base mb-1">
              מועד האיסוף נקבע!
            </p>
            <p className="text-green-600 text-sm mb-4">
              נבחר: {scheduledDay}, {scheduledTime}
            </p>
            <button onClick={() => navigate("/status")}
              className="bg-rw-btn text-white rounded-xl px-5 py-2.5 text-sm font-semibold">
              חזרה למסע התרומה
            </button>
          </div>
        ) : (
          <>
            {/* פרטי התרומה */}
            <div className="bg-rw-card rounded-2xl shadow-sm p-4">
              <h2 className="font-bold text-rw-title text-sm mb-3 text-right">
                פרטי התרומה
              </h2>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-rw-sub text-sm">{bagLabel}</span>
                  <span className="font-semibold text-rw-title text-sm">השק</span>
                </div>
              </div>
            </div>

            {/* טופס תיאום */}
            <div className="bg-rw-card rounded-2xl shadow-sm p-4 flex flex-col gap-4">

              {/* ─── ימים מהעמותה ─── */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-rw-title text-right">
                  ימים אפשריים לאיסוף:
                </label>
                <div className="flex flex-wrap gap-2 justify-end">
                  {availableDays.map(day => (
                    <button key={day} onClick={() => setSelectedDay(day)}
                      className={`px-3 py-2 rounded-xl text-sm font-semibold
                                 ${selectedDay === day
                                   ? "bg-rw-btn text-white"
                                   : "bg-rw-input text-rw-sub border border-rw-border"}`}>
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* ─── שעות מהעמותה ─── */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-rw-title text-right">
                  שעות אפשריות לאיסוף:
                </label>
                <div className="flex flex-wrap gap-2 justify-end">
                  {availableTimes.map(time => (
                    <button key={time} onClick={() => setSelectedTime(time)}
                      className={`px-3 py-2 rounded-xl text-sm font-semibold
                                 ${selectedTime === time
                                   ? "bg-rw-btn text-white"
                                   : "bg-rw-input text-rw-sub border border-rw-border"}`}>
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* סיכום בחירה */}
              {selectedDay && selectedTime && (
                <div className="bg-rw-bg rounded-xl px-3 py-2 text-right">
                  <p className="text-xs text-rw-sub">
                    בחרת: <span className="font-bold text-rw-title">
                      {selectedDay}, {selectedTime}
                    </span>
                  </p>
                </div>
              )}

              <button onClick={handleSubmit} disabled={sending}
                className="w-full bg-rw-btn text-white rounded-xl py-3
                           text-sm font-semibold flex items-center justify-center gap-2
                           active:bg-rw-btn-hover disabled:opacity-60">
                <span>📅</span>
                <span>{sending ? "שולח..." : "אישור מועד"}</span>
              </button>

            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
}
