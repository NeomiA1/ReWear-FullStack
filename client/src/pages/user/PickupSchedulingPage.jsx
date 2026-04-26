import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUser } from "../../context/UserContext";

export default function PickupSchedulingPage() {

  const navigate = useNavigate();
  // useParams = שולף את ה-id מה-URL
  // למשל: /pickup/1234567890 → params.id = "1234567890"
  const { id } = useParams();
  const { sentDonations, updateSentDonation } = useUser();

  // מוצאים את התרומה הספציפית לפי ה-id מה-URL
  const donation = sentDonations.find(d => d.id === Number(id));

  const [timeRange, setTimeRange] = useState("");
  const [address, setAddress]     = useState("");
  const [sent, setSent]           = useState(false);

  // אפשרויות שעות
  const timeOptions = [
    "08:00 – 10:00",
    "10:00 – 12:00",
    "12:00 – 14:00",
    "14:00 – 16:00",
    "16:00 – 18:00",
    "18:00 – 20:00",
  ];

  const handleSubmit = () => {
    if (!timeRange || !address) {
      alert("אנא מלאי את כל השדות");
      return;
    }

    // מעדכנים את התרומה ב-Context
    // pickupScheduled: true = תיאום בוצע
    updateSentDonation(Number(id), {
      pickupScheduled: true,
      pickupTime: timeRange,
      pickupAddress: address,
    });

    setSent(true);
  };

  // אם לא נמצאה תרומה
  if (!donation) {
    return (
      <div className="min-h-screen bg-rw-bg flex items-center justify-center px-6">
        <div className="bg-rw-card rounded-2xl p-6 text-center shadow-sm">
          <p className="text-3xl mb-2">⚠️</p>
          <p className="text-rw-title font-semibold mb-1">תרומה לא נמצאה</p>
          <button
            onClick={() => navigate("/notifications")}
            className="mt-4 bg-rw-btn text-white rounded-xl px-4 py-2 text-sm"
          >
            חזרה להתראות
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rw-bg overflow-y-auto pb-10">

      {/* כותרת */}
      <div className="sticky top-0 bg-rw-bg z-10
                      flex items-center justify-between
                      px-5 py-4 border-b border-rw-border">
        <button
          onClick={() => navigate("/notifications")}
          className="text-rw-sub text-2xl"
        >
          →
        </button>
        <h1 className="font-bold text-rw-title text-base">תיאום איסוף</h1>
        <div className="w-6"></div>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-5">

        {/* הודעת הצלחה */}
        {sent ? (
          <div className="bg-green-50 border border-green-200
                          rounded-2xl p-6 text-center">
            <p className="text-4xl mb-3">✅</p>
            <p className="font-bold text-green-700 text-base mb-1">
              הבקשה נשלחה בהצלחה!
            </p>
            <p className="text-green-600 text-sm mb-4">
              {donation.org.name} תאשר את מועד האיסוף בקרוב
            </p>
            <button
              onClick={() => navigate("/notifications")}
              className="bg-rw-btn text-white rounded-xl px-5 py-2.5
                         text-sm font-semibold"
            >
              חזרה להתראות
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
                <div className="flex justify-between items-center">
                  <span className="text-rw-sub text-sm">{donation.org.name}</span>
                  <span className="font-semibold text-rw-title text-sm">עמותה</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-rw-sub text-sm">
                    {[donation.bag.size, donation.bag.gender, donation.bag.condition]
                      .filter(Boolean).join(" · ")}
                  </span>
                  <span className="font-semibold text-rw-title text-sm">השק</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-rw-sub text-sm">{donation.date}</span>
                  <span className="font-semibold text-rw-title text-sm">תאריך שליחה</span>
                </div>
              </div>
            </div>

            {/* טופס תיאום */}
            <div className="bg-rw-card rounded-2xl shadow-sm p-4 flex flex-col gap-4">

              {/* בחירת שעות */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-rw-title text-right">
                  טווח שעות מועדף לאיסוף
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {timeOptions.map((time) => (
                    <button
                      key={time}
                      onClick={() => setTimeRange(time)}
                      className={`border rounded-xl py-2.5 text-sm font-medium
                                 transition-all
                                 ${timeRange === time
                                   ? "border-rw-btn bg-rw-btn text-white"
                                   : "border-rw-border bg-rw-input text-rw-sub"}`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* כתובת איסוף */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-rw-title text-right">
                  כתובת לאיסוף
                </label>
                <input
                  type="text"
                  placeholder="עיר, רחוב ומספר בית"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="border border-rw-border rounded-xl px-4 py-3
                             text-sm text-right outline-none bg-rw-input
                             focus:border-rw-btn"
                />
              </div>

              {/* כפתור שליחה */}
              <button
                onClick={handleSubmit}
                className="w-full bg-rw-btn text-white rounded-xl py-3
                           text-sm font-semibold flex items-center justify-center gap-2
                           active:bg-rw-btn-hover"
              >
                <span>📅</span>
                <span>שלחי הצעה לתיאום</span>
              </button>

            </div>
          </>
        )}

      </div>
    </div>
  );
}