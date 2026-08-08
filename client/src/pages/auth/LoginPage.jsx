import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { loginUser } from "../../services/userService";
import AuthLayout from "../../components/AuthLayout";
import { homeRouteForRole } from "../../utils/roles";
import { useToast } from "../../hooks/useToast";

function deriveType(userType) {
  switch (userType) {
    case "Association": return "org";
    case "Store":       return "shop";
    case "Private":
    default:            return "private";
  }
}

export default function LoginPage() {

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");

  const navigate    = useNavigate();
  const { setUser } = useUser();
  const toast       = useToast();

  const handleLogin = async () => {
    if (!email || !password) {
      toast.warning("אנא מלא/י אימייל וסיסמה");
      return;
    }

    try {
      const user = await loginUser({ email, password });

      const type = deriveType(user.userType);

      setUser({
        ...user,
        type,      
      });

      navigate(homeRouteForRole(type));

    } catch (error) {
      console.error(error);
      // loginUser throws the server's error text (e.g. "Invalid email or
      // password") as a string; a real network/exception failure throws an
      // Error object instead — tell those two cases apart for the user.
      toast.error(typeof error === "string" ? "אימייל או סיסמה שגויים" : "שגיאה בהתחברות לשרת");
    }
  };

  return (
    <AuthLayout>
      <div className="flex flex-col items-center w-full">

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

      <p className="text-sm text-rw-sub mt-6">
        אין לך חשבון?{" "}
        <span onClick={() => navigate("/register")}
          className="text-rw-green font-semibold cursor-pointer">
          הרשמה
        </span>
      </p>

      </div>
    </AuthLayout>
  );
}