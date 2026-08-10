import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import OrgBottomNav from "../../components/OrgBottomNav"; // ✅ מהקובץ המשותף
import PageContainer from "../../components/PageContainer";
import { checkAssociationExists, updateAssociationAvailability } from "../../services/associationService";
import { getAssociationDonationRequests } from "../../services/donationRequestService";
import { useToast } from "../../hooks/useToast";

function Toggle({ value, onChange }) {
  return (
    <div onClick={onChange}
      className={`w-12 h-6 rounded-full cursor-pointer transition-colors
                  flex items-center px-1
                  ${value ? "bg-rw-btn" : "bg-gray-300"}`}>
      <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform
                       ${value ? "translate-x-6" : "translate-x-0"}`} />
    </div>
  );
}

export default function OrgProfilePage() {
  const navigate = useNavigate();
  const { user, updateOrgSettings, getOrgSettings, logout } = useUser();

  const savedUser = JSON.parse(localStorage.getItem("rewear_user") || "{}");
  const orgName   = user?.orgName || savedUser?.orgName || "העמותה שלי";
  const currentSettings = getOrgSettings(orgName);

  // מקור הנתונים זהה ל-OrgHomePage (GET /DonationRequests/association/user/{id}),
  // כדי ששני המסכים יציגו את אותו מספר.
  const [donationRequests, setDonationRequests] = useState([]);

  useEffect(() => {
    if (!user?.userId) return;
    const loadDonationRequests = async () => {
      try {
        const requests = await getAssociationDonationRequests(user.userId);
        setDonationRequests(requests);
      } catch {
        // best-effort — leave the list as-is on failure
      }
    };
    loadDonationRequests();
  }, [user?.userId]);

  const totalReceived = donationRequests.filter(r =>
    r.requestStatus === "Approved"
  ).length;

  // אין כרגע שדה אמיתי בשרת לתיאום איסוף עצמי (הקצאת ימים/שעות היא
  // מקומית בלבד -- ראו OrgRequestsPage) -- נשאר 0 עד שהתכונה תתמומש בפועל.
  const totalPickupsCoordinated = 0;

  const [isAvailable,   setIsAvailable]   = useState(currentSettings.isAvailable);
  const [acceptsPickup, setAcceptsPickup] = useState(currentSettings.acceptsPickup);
  const [acceptsDropoff,setAcceptsDropoff]= useState(currentSettings.acceptsDropoff);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const handleSave = async () => {
  
    updateOrgSettings(orgName, { isAvailable, acceptsPickup, acceptsDropoff });

    setSaving(true);
    try {
     
      const real = await checkAssociationExists(orgName, user?.email || "");
      if (real) {
        await updateAssociationAvailability(real.associationId, isAvailable);
      }
      toast.success("ההגדרות נשמרו בהצלחה");
    } catch (err) {
      console.error(err);
      toast.warning("ההגדרות נשמרו מקומית, אך אירעה שגיאה בעדכון השרת.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer className="pb-24 overflow-y-auto" wide>

      <div className="sticky top-0 bg-rw-bg z-10
                      flex items-center justify-between
                      px-5 py-4 border-b border-rw-border">
        <button onClick={() => { logout(); navigate("/"); }}
          className="text-xs text-rw-sub border border-rw-border
                     rounded-xl px-3 py-1.5">
          התנתקות
        </button>
        <h1 className="font-bold text-rw-title text-base">פרופיל עמותה</h1>
        <button onClick={() => navigate("/org/home")} className="text-rw-sub text-2xl">
          →
        </button>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-5">

        {/* פרטי עמותה */}
        <div className="bg-rw-card rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-rw-logo
                            flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {orgName.charAt(0)}
              </span>
            </div>
            <div className="flex flex-col items-end flex-1">
              <h2 className="font-bold text-rw-title text-base">{orgName}</h2>
              <p className="text-rw-sub text-xs mt-0.5">
                {savedUser?.address || "כתובת לא הוגדרה"}
              </p>
              <p className="text-rw-sub text-xs mt-0.5">
                📞 {savedUser?.phone || ""}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-rw-input rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-rw-title">{totalReceived}</p>
              <p className="text-xs text-rw-sub mt-1">תרומות שהתקבלו</p>
            </div>
            <div className="bg-rw-input rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-rw-title">{totalPickupsCoordinated}</p>
              <p className="text-xs text-rw-sub mt-1">תיאומי איסוף</p>
            </div>
          </div>
        </div>

        {/* הגדרות */}
        <div className="bg-rw-card rounded-2xl shadow-sm p-5">
          <h3 className="font-bold text-rw-title text-sm mb-4 text-right">
            הגדרות פעילות
          </h3>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <Toggle value={isAvailable} onChange={() => setIsAvailable(p => !p)} />
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-rw-title">זמינה לקבל תרומות</span>
                <span className={`text-xs mt-0.5 ${isAvailable ? "text-green-500" : "text-red-400"}`}>
                  {isAvailable ? "פעיל – מקבלים תרומות כרגע" : "לא זמינים כרגע"}
                </span>
              </div>
            </div>
            <div className="h-px bg-rw-border" />
            <p className="text-sm font-semibold text-rw-title text-right">אופן קבלת תרומות</p>
            <div className="flex items-center justify-between">
              <Toggle value={acceptsPickup} onChange={() => setAcceptsPickup(p => !p)} />
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-rw-title">איסוף מהבית</span>
                <span className="text-xs text-rw-sub mt-0.5">העמותה מגיעה לאסוף מהתורם</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Toggle value={acceptsDropoff} onChange={() => setAcceptsDropoff(p => !p)} />
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-rw-title">הגעה לעמותה</span>
                <span className="text-xs text-rw-sub mt-0.5">התורם מביא לעמותה</span>
              </div>
            </div>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="w-full bg-rw-btn text-white rounded-xl py-3
                       text-sm font-semibold mt-5 active:bg-rw-btn-hover
                       disabled:opacity-50">
            {saving ? "שומרת..." : "שמירת הגדרות"}
          </button>
        </div>
      </div>

      <OrgBottomNav active="profile" />
    </PageContainer>
  );
}
