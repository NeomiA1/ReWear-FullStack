import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { registerOrganization } from "../../services/associationService";
import { getAllCauses } from "../../services/causesService";
import { CATEGORIES } from "../../data/associations";
import AuthLayout from "../../components/AuthLayout";
import { useToast } from "../../hooks/useToast";

const WORK_MODE_OPTIONS = [
  { value: "SecondHandStores", label: "חנויות יד שנייה"  },
  { value: "OwnStore",         label: "חנות עצמאית"      },
  { value: "PhysicalOnly",     label: "מחסן / פיזי בלבד" },
];

const DELIVERY_MODE_OPTIONS = [
  { value: "Both",        label: "איסוף + הגעה עצמית" },
  { value: "Pickup",      label: "איסוף מהתורם בלבד"  },
  { value: "SelfArrival", label: "הגעה עצמית בלבד"    },
];

export default function RegisterOrgPage() {

  const [orgName,      setOrgName]      = useState("");
  const [orgNumber,    setOrgNumber]    = useState("");
  const [contact,      setContact]      = useState("");
  const [phone,        setPhone]        = useState("");
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [address,      setAddress]      = useState("");
  const [logoPreview,  setLogoPreview]  = useState(null);
  const [workMode,     setWorkMode]     = useState("");
  const [deliveryMode, setDeliveryMode] = useState("");
  const [causes,       setCauses]       = useState([]);
  const [causeIds,     setCauseIds]     = useState([]);
  const [acceptedCategoryIds, setAcceptedCategoryIds] = useState([]);
  const [loading,      setLoading]      = useState(false);

  const { setUser } = useUser();
  const navigate    = useNavigate();
  const toast       = useToast();

  useEffect(() => {
    let cancelled = false;
    getAllCauses()
      .then((data) => {
        if (!cancelled) setCauses(data);
      })
      .catch(() => {
        // רשימה ריקה = פשוט לא יוצגו checkbox-ים; שדה אופציונלי בהרשמה.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleCause = (causeId) => {
    setCauseIds((prev) =>
      prev.includes(causeId) ? prev.filter((c) => c !== causeId) : [...prev, causeId]
    );
  };

  const toggleCategory = (categoryId) => {
    setAcceptedCategoryIds((prev) =>
      prev.includes(categoryId) ? prev.filter((c) => c !== categoryId) : [...prev, categoryId]
    );
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleRegister = async () => {
    if (!orgName || !orgNumber || !contact || !phone ||
        !email || !password || !address || !workMode || !deliveryMode) {
      toast.warning("אנא מלא/י את כל השדות");
      return;
    }
    if (password.length < 6) {
      toast.warning("הסיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }

    setLoading(true);

    try {
      const createdUser = await registerOrganization({
        fullName:        contact,
        email:           email,
        password:        password,
        phone:           phone,
        city:            null,
        associationName: orgName,
        orgNumber:       orgNumber,
        address:         address,
        workMode:        workMode,
        deliveryMode:    deliveryMode,
        causeIds:        causeIds,
        acceptedCategoryIds: acceptedCategoryIds,
      });

      const { userType, ...userWithoutServerType } = createdUser;

      setUser({
        ...userWithoutServerType,
        orgName,
        type: "org",
      });

      navigate("/org/home");

    } catch (err) {
      toast.error(typeof err === "string" ? err : "שגיאה בהרשמה. אנא נסה/י שוב.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout wide showBranding={false}>

      <div className="flex justify-end mb-6">
        <button onClick={() => navigate("/register")} className="text-rw-sub text-2xl">
          →
        </button>
      </div>

      <div className="flex flex-col items-center mb-6">
        <div className="relative w-24 h-24 rounded-full bg-rw-input
                        border-2 border-dashed border-rw-border
                        flex items-center justify-center cursor-pointer">
          {logoPreview ? (
            <img src={logoPreview} alt="לוגו"
              className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-3xl">📷</span>
          )}
          <input type="file" accept="image/*" onChange={handleLogoChange}
            className="absolute inset-0 opacity-0 cursor-pointer" />
        </div>
        <p className="text-rw-green text-sm mt-2">העלאת לוגו העמותה</p>
      </div>

      <div className="bg-rw-card rounded-2xl shadow-sm p-6 flex flex-col gap-5">

        <div className="flex flex-col gap-1">
          <label className="text-sm text-rw-sub text-right">שם העמותה</label>
          <input type="text" placeholder="שם העמותה" value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className="border border-rw-border rounded-xl px-4 py-3
                       text-sm text-right outline-none bg-rw-input focus:border-rw-btn" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-rw-sub text-right">מספר עמותה (ח.פ)</label>
          <input type="text" placeholder="מספר עמותה (ח.פ)" value={orgNumber}
            onChange={(e) => setOrgNumber(e.target.value)} dir="ltr"
            className="border border-rw-border rounded-xl px-4 py-3
                       text-sm text-left outline-none bg-rw-input focus:border-rw-btn" />
        </div>

        <div className="flex flex-row gap-3">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-sm text-rw-sub text-right">איש קשר</label>
            <input type="text" placeholder="איש קשר" value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="border border-rw-border rounded-xl px-3 py-3
                         text-sm text-right outline-none bg-rw-input focus:border-rw-btn w-full" />
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-sm text-rw-sub text-right">טלפון</label>
            <input type="tel" placeholder="טלפון" value={phone}
              onChange={(e) => setPhone(e.target.value)} dir="ltr"
              className="border border-rw-border rounded-xl px-3 py-3
                         text-sm text-left outline-none bg-rw-input focus:border-rw-btn w-full" />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-rw-sub text-right">אימייל</label>
          <input type="email" placeholder="אימייל" value={email}
            onChange={(e) => setEmail(e.target.value)} dir="ltr"
            className="border border-rw-border rounded-xl px-4 py-3
                       text-sm text-left outline-none bg-rw-input focus:border-rw-btn" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-rw-sub text-right">סיסמה</label>
          <input type="password" placeholder="מינימום 6 תווים" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-rw-border rounded-xl px-4 py-3
                       text-sm text-right outline-none bg-rw-input focus:border-rw-btn" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-rw-sub text-right">כתובת</label>
          <input type="text" placeholder="עיר / כתובת" value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="border border-rw-border rounded-xl px-4 py-3
                       text-sm text-right outline-none bg-rw-input focus:border-rw-btn" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-rw-sub text-right">אופן פעילות העמותה</label>
          <select value={workMode} onChange={(e) => setWorkMode(e.target.value)}
            className="border border-rw-border rounded-xl px-4 py-3
                       text-sm text-right outline-none bg-rw-input focus:border-rw-btn
                       appearance-none cursor-pointer">
            <option value="">בחר/י אופן פעילות</option>
            {WORK_MODE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-rw-sub text-right">אופן קבלת תרומות</label>
          <select value={deliveryMode} onChange={(e) => setDeliveryMode(e.target.value)}
            className="border border-rw-border rounded-xl px-4 py-3
                       text-sm text-right outline-none bg-rw-input focus:border-rw-btn
                       appearance-none cursor-pointer">
            <option value="">בחר/י אופן קבלה</option>
            {DELIVERY_MODE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {causes.length > 0 && (
          <div className="flex flex-col gap-1">
            <label className="text-sm text-rw-sub text-right">תחומי פעילות (אופציונלי)</label>
            <div className="flex flex-wrap gap-2 justify-end">
              {causes.map((cause) => (
                <button
                  key={cause.causeId}
                  type="button"
                  onClick={() => toggleCause(cause.causeId)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors
                    ${causeIds.includes(cause.causeId)
                      ? "bg-rw-btn text-white border-rw-btn"
                      : "bg-rw-input text-rw-sub border-rw-border"}`}
                >
                  {cause.labelHe}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-sm text-rw-sub text-right">גילי יעד שהעמותה מקבלת (אופציונלי)</label>
          <div className="flex flex-wrap gap-2 justify-end">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => toggleCategory(category.id)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors
                  ${acceptedCategoryIds.includes(category.id)
                    ? "bg-rw-btn text-white border-rw-btn"
                    : "bg-rw-input text-rw-sub border-rw-border"}`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleRegister} disabled={loading}
          className="w-full bg-rw-btn text-white rounded-xl py-3
                     text-sm font-semibold mt-2 active:bg-rw-btn-hover
                     disabled:opacity-50">
          {loading ? "רושמת..." : "סיום הרשמה"}
        </button>

      </div>

      <p className="text-sm text-rw-sub text-center mt-6">
        כבר יש לך חשבון?{" "}
        <span onClick={() => navigate("/")}
          className="text-rw-green font-semibold cursor-pointer">
          התחברות
        </span>
      </p>

    </AuthLayout>
  );
}