import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import PageContainer from "../../components/PageContainer";
import { useToast } from "../../hooks/useToast";

export default function PickupSchedulingPage() {
  const navigate = useNavigate();
  const { id }   = useParams();
  const { sentDonations, updateSentDonation } = useUser();
  const toast = useToast();

  const donation = sentDonations.find(d => d.id === Number(id));

  const [selectedDay,  setSelectedDay]  = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [address,      setAddress]      = useState("");
  const [sent,         setSent]         = useState(false);

  const handleSubmit = () => {
    if (!selectedDay || !selectedTime || !address.trim()) {
      toast.warning("אנא מלאי את כל השדות");
      return;
    }
    updateSentDonation(Number(id), {
      pickupScheduled: true,
      pickupTime:      `${selectedDay} ${selectedTime}`,
      pickupAddress:   address,
      status:          "scheduled",
    });
    setSent(true);
  };

  // תרומה לא נמצאה
  if (!donation) {
    return (
      <div className="min-h-screen bg-rw-bg flex items-center justify-center px-6">
        <div className="bg-rw-card rounded-2xl p-6 text-center shadow-sm">
          <p className="text-3xl mb-2">⚠️</p>
          <p className="text-rw-title font-semibold mb-1">תרומה לא נמצאה</p>
          <button onClick={() => navigate("/notifications")}
            className="mt-4 bg-rw-btn text-white rounded-xl px-4 py-2 text-sm">
            חזרה להתראות
          </button>
        </div>
      </div>
    );
  }

  // תרומה טרם אושרה
  if (donation.status === "pending") {
    return (
      <div className="min-h-screen bg-rw-bg flex items-center justify-center px-6">
        <div className="bg-rw-card rounded-2xl p-6 text-center shadow-sm">
          <p className="text-3xl mb-3">⏳</p>
          <p className="font-bold text-rw-title mb-1">ממתין לאישור העמותה</p>
          <p className="text-rw-sub text-sm">
            {donation.org?.name} טרם אישרה את הבקשה.
          </p>
          <button onClick={() => navigate("/profile")}
            className="mt-4 bg-rw-btn text-white rounded-xl px-5 py-2.5 text-sm font-semibold">
            חזרה לפרופיל
          </button>
        </div>
      </div>
    );
  }

  const bagLabel = donation.bag
    ? [donation.bag.size, donation.bag.gender, donation.bag.condition]
        .filter(Boolean).join(" · ")
    : "שק תרומה";

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
        {sent ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
            <p className="text-4xl mb-3">✅</p>
            <p className="font-bold text-green-700 text-base mb-1">
              בקשת האיסוף נשלחה!
            </p>
            <p className="text-green-600 text-sm mb-4">
              {donation.org?.name} תאשר את מועד האיסוף בקרוב
            </p>
            <button onClick={() => navigate("/profile")}
              className="bg-rw-btn text-white rounded-xl px-5 py-2.5 text-sm font-semibold">
              חזרה לפרופיל
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
                  <span className="text-rw-sub text-sm">{donation.org?.name}</span>
                  <span className="font-semibold text-rw-title text-sm">עמותה</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-rw-sub text-sm">{bagLabel}</span>
                  <span className="font-semibold text-rw-title text-sm">השק</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-rw-sub text-sm">{donation.date}</span>
                  <span className="font-semibold text-rw-title text-sm">תאריך שליחה</span>
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
                {donation.availableDays?.length > 0 ? (
                  <div className="flex flex-wrap gap-2 justify-end">
                    {donation.availableDays.map(day => (
                      <button key={day} onClick={() => setSelectedDay(day)}
                        className={`px-3 py-2 rounded-xl text-sm font-semibold
                                   ${selectedDay === day
                                     ? "bg-rw-btn text-white"
                                     : "bg-rw-input text-rw-sub border border-rw-border"}`}>
                        {day}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-rw-sub text-xs text-right">
                    העמותה לא הגדירה ימים – תיצרי קשר ישירות.
                  </p>
                )}
              </div>

              {/* ─── שעות מהעמותה ─── */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-rw-title text-right">
                  שעות אפשריות לאיסוף:
                </label>
                {donation.availableTimes?.length > 0 ? (
                  <div className="flex flex-wrap gap-2 justify-end">
                    {donation.availableTimes.map(time => (
                      <button key={time} onClick={() => setSelectedTime(time)}
                        className={`px-3 py-2 rounded-xl text-sm font-semibold
                                   ${selectedTime === time
                                     ? "bg-rw-btn text-white"
                                     : "bg-rw-input text-rw-sub border border-rw-border"}`}>
                        {time}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-rw-sub text-xs text-right">
                    העמותה לא הגדירה שעות – תיצרי קשר ישירות.
                  </p>
                )}
              </div>

              {/* ─── כתובת איסוף ─── */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-rw-title text-right">
                  כתובת לאיסוף:
                </label>
                <input type="text"
                  placeholder="עיר, רחוב ומספר בית"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="border border-rw-border rounded-xl px-4 py-3
                             text-sm text-right outline-none bg-rw-input
                             focus:border-rw-btn" />
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

              <button onClick={handleSubmit}
                className="w-full bg-rw-btn text-white rounded-xl py-3
                           text-sm font-semibold flex items-center justify-center gap-2
                           active:bg-rw-btn-hover">
                <span>📅</span>
                <span>שלחי הצעה לתיאום</span>
              </button>

            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
}
