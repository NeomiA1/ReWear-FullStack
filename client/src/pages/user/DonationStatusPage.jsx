// src/pages/user/DonationStatusPage.jsx
// מסך "מסע התרומה" — מציג לכל שק תרומה אמיתי (מהשרת) את המסלול המלא שלו,
// לא רק נקודת סטטוס בודדת. נתונים: bag.status/bag.createdAt מהשרת +
// רשומת שליחה מקומית אמיתית (donationSendLog.js) לפרטי העמותה/תאריך.

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import BottomNav from "../../components/BottomNav";
import PageContainer from "../../components/PageContainer";
import DonationJourneyTimeline from "../../components/DonationJourneyTimeline";
import { getDonationBagsByUserId } from "../../services/donationBagService";
import { buildDonationJourney } from "../../utils/donationJourney";
import { getDonationSendRecord } from "../../utils/donationSendLog";

export default function DonationStatusPage() {
  const navigate = useNavigate();
  const { user } = useUser();

  const [bags, setBags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadBags = async () => {
      if (!user?.userId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getDonationBagsByUserId(user.userId);
        setBags(data || []);
      } catch (err) {
        console.error(err);
        setError("לא הצלחנו לטעון את השקים שלך. בדקי את החיבור ונסי שוב.");
      } finally {
        setLoading(false);
      }
    };
    loadBags();
  }, [user]);

  const sortedBags = [...bags].sort((a, b) =>
    new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );

  return (
    <PageContainer className="pb-24 overflow-y-auto" wide>

      {/* Header */}
      <div className="sticky top-0 bg-rw-bg z-10
                      flex items-center justify-between
                      px-5 py-4 border-b border-rw-border">
        <button onClick={() => navigate("/home")} className="text-rw-sub text-2xl">→</button>
        <h1 className="font-bold text-rw-title text-base">מסע התרומה שלי</h1>
        <div className="w-6" />
      </div>

      <div className="px-5 pt-5 flex flex-col gap-6">

        {loading && (
          <div className="bg-rw-card rounded-2xl p-5 text-center shadow-sm">
            <p className="text-3xl mb-2">⏳</p>
            <p className="text-rw-sub text-sm">טוענת את השקים שלך...</p>
            <p className="text-rw-sub text-[11px] mt-1">
              אם זו הפעם הראשונה היום, זה עשוי לקחת עד 30 שניות
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
            <p className="text-3xl mb-2">⚠️</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && sortedBags.length === 0 && (
          <div className="flex flex-col items-center gap-4 pt-20">
            <span className="text-5xl">📦</span>
            <p className="font-bold text-rw-title text-base">אין תרומות עדיין</p>
            <p className="text-rw-sub text-sm text-center">
              העלי שק תרומה ושלחי אותו לעמותה כדי להתחיל את המסע
            </p>
            <button onClick={() => navigate("/upload")}
              className="bg-rw-btn text-white rounded-xl px-6 py-3 text-sm font-semibold">
              העלי שק ראשון
            </button>
          </div>
        )}

        {!loading && !error && sortedBags.map((bag) => {
          const sendRecord = getDonationSendRecord(user?.userId, bag.bagId);
          const { steps, progressPercent } = buildDonationJourney(bag, sendRecord);
          const bagLabel = [bag.sizes, bag.targetGender, bag.clothesCondition]
            .filter(Boolean).join(" · ") || "שק תרומה";

          return (
            <div key={bag.bagId} className="bg-rw-card rounded-2xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-rw-border">
                <span className="text-2xl">🛍️</span>
                <div className="text-right">
                  <p className="font-semibold text-rw-title text-sm">{bagLabel}</p>
                  {sendRecord?.associationName && (
                    <p className="text-rw-sub text-xs mt-0.5">אל {sendRecord.associationName}</p>
                  )}
                </div>
              </div>
              <DonationJourneyTimeline steps={steps} progressPercent={progressPercent} />
            </div>
          );
        })}

      </div>

      <BottomNav active="status" />
    </PageContainer>
  );
}
