import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { registerStore } from "../../services/storeService";
import AuthLayout from "../../components/AuthLayout";
import { useToast } from "../../hooks/useToast";

// המסך זהה לעמותה, רק עם שינויים קטנים:
// - כותרת שונה
// - placeholder של לוגו שונה
// - אין מספר עמותה, במקומו מספר עוסק/ח.פ

export default function RegisterShopPage() {

  const [shopName, setShopName]       = useState(""); // שם החנות
  const [bizNumber, setBizNumber]     = useState(""); // מספר עוסק/ח.פ
  const [contact, setContact]         = useState(""); // איש קשר
  const [phone, setPhone]             = useState(""); // טלפון
  const [email, setEmail]             = useState(""); // אימייל
  const [password, setPassword]       = useState(""); // סיסמה
  const [address, setAddress]         = useState(""); // כתובת
  const [logoPreview, setLogoPreview] = useState(null); // תצוגה מקדימה של לוגו
  const [loading, setLoading]         = useState(false);

  const { setUser } = useUser();
  const navigate    = useNavigate();
  const toast       = useToast();

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleRegister = async () => {
    if (!shopName || !bizNumber || !contact || !phone || !email || !password || !address) {
      toast.warning("אנא מלא/י את כל השדות");
      return;
    }
    if (password.length < 6) {
      toast.warning("הסיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }

    setLoading(true);

    try {
      const createdUser = await registerStore({
        fullName: contact,
        email,
        password,
        phone,
        city: null,
        storeName: shopName,
        address,
      });

      const { userType, ...userWithoutServerType } = createdUser;

      setUser({
        ...userWithoutServerType,
        shopName,       // display field — not in Users table
        type: "shop",   // client-side routing alias
      });

      navigate("/shop/home");

    } catch (err) {
      toast.error(typeof err === "string" ? err : "שגיאה בהרשמה. אנא נסה/י שוב.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout wide showBranding={false}>

      {/* חץ חזרה */}
      <div className="flex justify-end mb-6">
        <button onClick={() => navigate("/register")} className="text-rw-sub text-2xl">
          →
        </button>
      </div>

      {/* העלאת לוגו */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative w-24 h-24 rounded-full bg-rw-input
                        border-2 border-dashed border-rw-border
                        flex items-center justify-center cursor-pointer">
          {logoPreview ? (
            <img src={logoPreview} alt="לוגו" className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-3xl">📷</span>
          )}
          <input type="file" accept="image/*" onChange={handleLogoChange}
            className="absolute inset-0 opacity-0 cursor-pointer" />
        </div>
        <p className="text-rw-green text-sm mt-2">העלאת לוגו החנות</p>
      </div>

      {/* טופס */}
      <div className="bg-rw-card rounded-2xl shadow-sm p-6 flex flex-col gap-5">

        {/* שם החנות */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-rw-sub text-right">שם החנות</label>
          <input type="text" placeholder="שם החנות" value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            className="border border-rw-border rounded-xl px-4 py-3
                       text-sm text-right outline-none bg-rw-input focus:border-rw-btn" />
        </div>

        {/* מספר עוסק */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-rw-sub text-right">מספר עוסק / ח.פ</label>
          <input type="text" placeholder="מספר עוסק / ח.פ" value={bizNumber}
            onChange={(e) => setBizNumber(e.target.value)} dir="ltr"
            className="border border-rw-border rounded-xl px-4 py-3
                       text-sm text-left outline-none bg-rw-input focus:border-rw-btn" />
        </div>

        {/* איש קשר + טלפון */}
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

        {/* אימייל */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-rw-sub text-right">אימייל</label>
          <input type="email" placeholder="אימייל" value={email}
            onChange={(e) => setEmail(e.target.value)} dir="ltr"
            className="border border-rw-border rounded-xl px-4 py-3
                       text-sm text-left outline-none bg-rw-input focus:border-rw-btn" />
        </div>

        {/* סיסמה */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-rw-sub text-right">סיסמה</label>
          <input type="password" placeholder="מינימום 6 תווים" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-rw-border rounded-xl px-4 py-3
                       text-sm text-right outline-none bg-rw-input focus:border-rw-btn" />
        </div>

        {/* כתובת */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-rw-sub text-right">כתובת</label>
          <input type="text" placeholder="עיר / כתובת" value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="border border-rw-border rounded-xl px-4 py-3
                       text-sm text-right outline-none bg-rw-input focus:border-rw-btn" />
        </div>

        {/* כפתור */}
        <button onClick={handleRegister} disabled={loading}
          className="w-full bg-rw-btn text-white rounded-xl py-3
                     text-sm font-semibold mt-2 active:bg-rw-btn-hover
                     disabled:opacity-50">
          {loading ? "רושמת..." : "סיום הרשמה"}
        </button>

      </div>

      <p className="text-sm text-rw-sub text-center mt-6">
        כבר יש לך חשבון?{" "}
        <span onClick={() => navigate("/")} className="text-rw-green font-semibold cursor-pointer">
          התחברות
        </span>
      </p>

    </AuthLayout>
  );
}