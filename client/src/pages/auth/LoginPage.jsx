import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import API_BASE_URL from "../../services/api";

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

const DEMO_SHOP = {
  userId:   3,
  shopName: "חנות חמד",
  email:    "shop@test.com",
  city:     "חיפה",
  items:    "בגדים ונעליים",
  type:     "shop",
};

function deriveType(userType) {
  switch (userType) {
    case "Association": return "org";
    case "Store":       return "shop";
    case "Private":
    default:            return "private";
  }
}

function homeRouteForType(type) {
  switch (type) {
    case "org":     return "/org/home";
    case "shop":    return "/shop/home";
    case "private":
    default:        return "/home";
  }
}

export default function LoginPage() {

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");

  const navigate    = useNavigate();
  const { setUser } = useUser();

  const handleLogin = async () => {
    if (!email || !password) {
      alert("אנא מלאי אימייל וסיסמה");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/Users/login`,
        {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ email, password }),
        }
      );

      if (!response.ok) {
        alert("אימייל או סיסמה שגויים");
        return;
      }

      const user = await response.json();

    
      const type = deriveType(user.userType);

      setUser({
        ...user,
        type,      
      });

      navigate(homeRouteForType(type));

    } catch (error) {
      console.error(error);
      alert("שגיאה בהתחברות לשרת");
    }
  };

  // ── Demo login handlers — 
  const handleDemoUser = () => { setUser(DEMO_USER); navigate("/home");      };
  const handleDemoOrg  = () => { setUser(DEMO_ORG);  navigate("/org/home");  };
  const handleDemoShop = () => { setUser(DEMO_SHOP); navigate("/shop/home"); };

  return (
    <div className="min-h-screen bg-rw-bg flex flex-col items-center justify-center px-6">

      <div className="w-16 h-16 rounded-2xl bg-rw-logo flex items-center justify-center mb-5">
        <span className="text-white text-2xl font-bold">R</span>
      </div>

      <h1 className="text-2xl font-bold text-rw-title mb-1">ReWear</h1>
      <p className="text-rw-sub text-sm mb-8 text-center">
        ברוכים השבים! התחברו לחשבונכם
      </p>

      {/* Login form */}
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

      {/* Demo section */}
      <div className="flex items-center gap-3 w-full mt-6 mb-4">
        <div className="flex-1 h-px bg-rw-border"></div>
        <span className="text-rw-sub text-xs">כניסה מהירה לבדיקה</span>
        <div className="flex-1 h-px bg-rw-border"></div>
      </div>

      <div className="w-full flex flex-col gap-3">
        <button onClick={handleDemoUser}
          className="w-full border-2 border-rw-btn text-rw-btn rounded-xl py-3
                     text-sm font-semibold active:bg-rw-btn/10
                     flex items-center justify-center gap-2">
          <span>👤</span>
          <span>משתמש פרטי – טליה כהן</span>
        </button>

        <button onClick={handleDemoOrg}
          className="w-full border-2 border-rw-title text-rw-title rounded-xl py-3
                     text-sm font-semibold active:bg-rw-title/10
                     flex items-center justify-center gap-2">
          <span>🏢</span>
          <span>עמותה – ויצו</span>
        </button>

        <button onClick={handleDemoShop}
          className="w-full border-2 border-rw-green text-rw-green rounded-xl py-3
                     text-sm font-semibold active:bg-rw-green/10
                     flex items-center justify-center gap-2">
          <span>🏪</span>
          <span>חנות יד שנייה – חנות חמד</span>
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