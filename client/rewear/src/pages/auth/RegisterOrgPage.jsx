import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";

export default function RegisterOrgPage() {

  const [orgName, setOrgName]         = useState("");
  const [orgNumber, setOrgNumber]     = useState("");
  const [contact, setContact]         = useState("");
  const [phone, setPhone]             = useState("");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [address, setAddress]         = useState("");
  const [logoPreview, setLogoPreview] = useState(null);

  const { setUser } = useUser();
  const navigate = useNavigate();

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleRegister = () => {
    if (!orgName || !orgNumber || !contact || !phone || !email || !password || !address) {
      alert("אנא מלאי את כל השדות");
      return;
    }
    if (password.length < 6) {
      alert("הסיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }

    const userData = {
      orgName,
      orgNumber,
      contact,
      phone,
      email,
      address,
      type: "org",
    };

    localStorage.setItem("rewear_user", JSON.stringify(userData));
    setUser(userData);
    window.location.href = "/org/home";
  };

  return (
    <div className="min-h-screen bg-rw-bg overflow-y-auto px-6 py-8">

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
          <input
            type="file" accept="image/*" onChange={handleLogoChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>
        <p className="text-rw-green text-sm mt-2">העלאת לוגו העמותה</p>
      </div>

      {/* טופס */}
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

        <button onClick={handleRegister}
          className="w-full bg-rw-btn text-white rounded-xl py-3
                     text-sm font-semibold mt-2 active:bg-rw-btn-hover">
          סיום הרשמה
        </button>

      </div>

      <p className="text-sm text-rw-sub text-center mt-6">
        כבר יש לך חשבון?{" "}
        <span onClick={() => navigate("/")} className="text-rw-green font-semibold cursor-pointer">
          התחברות
        </span>
      </p>

    </div>
  );
}