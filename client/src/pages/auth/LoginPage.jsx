import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";

// ─── משתמשי דמו קבועים ───────────────────────────────────────────────────────
const DEMO_USER = {
  userId:       1,
  fullName:     "טליה כהן",
  email:        "tali@test.com",
  phone:        "050-0000000",
  location:     "תל אביב",
  type:         "private",
  itemsDonated: 0,
  waterSaved:   0,
};

const DEMO_ORG = {
  userId:  2,
  orgName: "ויצו",
  email:   "org@test.com",
  type:    "org",
};

export default function LoginPage() {

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();
  const { setUser } = useUser();

  const handleLogin = async () => {
    if (!email || !password) {
      alert("אנא מלאי אימייל וסיסמה");
      return;
    }
    // בעתיד: await loginUser({ email, password })
    alert("התחברות לשרת עדיין לא מחוברת – השתמשי בכפתורי הדמו");
  };

  // ─── כניסה מהירה ─────────────────────────────────────────────────────────
  const handleDemoUser = () => {
    setUser(DEMO_USER);
    navigate("/home");
  };

  const handleDemoOrg = () => {
    setUser(DEMO_ORG);
    navigate("/org/home");
  };

  return (
    <div className="min-h-screen bg-rw-bg flex flex-col items-center justify-center px-6">

      <div className="w-16 h-16 rounded-2xl bg-rw-logo flex items-center justify-center mb-5">
        <span className="text-white text-2xl font-bold">R</span>
      </div>

      <h1 className="text-2xl font-bold text-rw-title mb-1">ReWear</h1>
      <p className="text-rw-sub text-sm mb-8 text-center">
        ברוכים השבים! התחברו לחשבונכם
      </p>

      {/* טופס רגיל */}
      <div className="w-full bg-rw-card rounded-2xl shadow-sm p-6 flex flex-col gap-4">

        <div className="flex flex-col gap-1">
          <label className="text-sm text-rw-sub">אימייל</label>
          <input type="email" placeholder="your@email.com" value={email}
            onChange={(e) => setEmail(e.target.value)} dir="ltr"
            className="border border-rw-border rounded-xl px-4 py-3
                       text-sm text-left outline-none focus:border-rw-btn bg-rw-input" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-rw-sub">סיסמה</label>
          <input type="password" placeholder="••••••••" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-rw-border rounded-xl px-4 py-3
                       text-sm outline-none focus:border-rw-btn bg-rw-input" />
        </div>

        <button onClick={handleLogin}
          className="bg-rw-btn text-white rounded-xl py-3
                     text-sm font-semibold mt-2 active:bg-rw-btn-hover">
          התחברות
        </button>

      </div>

      {/* מפריד */}
      <div className="flex items-center gap-3 w-full mt-6 mb-4">
        <div className="flex-1 h-px bg-rw-border"></div>
        <span className="text-rw-sub text-xs">כניסה מהירה לבדיקה</span>
        <div className="flex-1 h-px bg-rw-border"></div>
      </div>

      {/* כפתורי דמו */}
      <div className="w-full flex flex-col gap-3">
        <button onClick={handleDemoUser}
          className="w-full border-2 border-rw-btn text-rw-btn rounded-xl py-3
                     text-sm font-semibold active:bg-rw-btn/10
                     flex items-center justify-center gap-2">
          <span>👤</span>
          <span>כניסה כמשתמש – טליה כהן</span>
        </button>
        <button onClick={handleDemoOrg}
          className="w-full border-2 border-rw-title text-rw-title rounded-xl py-3
                     text-sm font-semibold active:bg-rw-title/10
                     flex items-center justify-center gap-2">
          <span>🏢</span>
          <span>כניסה כעמותה – ויצו</span>
        </button>
      </div>

      <p className="text-sm text-rw-sub mt-6">
        אין לך חשבון?{" "}
        <span onClick={() => navigate("/register")}
          className="text-rw-green font-semibold cursor-pointer">
          הרשמה
        </span>
      </p>

    </div>
  );
}
