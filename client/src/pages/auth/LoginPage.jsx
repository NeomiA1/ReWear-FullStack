import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { loginUser } from "../../services/userService";

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

    const loginData = {
      email: email,
      password: password
    };

    try {
      const loggedInUser = await loginUser(loginData);

      setUser({
        userId: loggedInUser.userId,
        fullName: loggedInUser.fullName,
        email: loggedInUser.email,
        phone: loggedInUser.phone,
        location: loggedInUser.city,
        type: "private",
        itemsDonated: 0,
        waterSaved: 0,
      });

      console.log("Login success:", loggedInUser);
      navigate("/home");

    } catch (error) {
      console.log("Login error:", error);
      alert("אימייל או סיסמה שגויים");
    }
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

      <div className="w-full bg-rw-card rounded-2xl shadow-sm p-6 flex flex-col gap-4">

        <div className="flex flex-col gap-1">
          <label className="text-sm text-rw-sub">אימייל</label>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            dir="ltr"
            className="border border-rw-border rounded-xl px-4 py-3
                       text-sm text-left outline-none focus:border-rw-btn bg-rw-input"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-rw-sub">סיסמה</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-rw-border rounded-xl px-4 py-3
                       text-sm outline-none focus:border-rw-btn bg-rw-input"
          />
        </div>

        <button
          onClick={handleLogin}
          className="bg-rw-btn text-white rounded-xl py-3
                     text-sm font-semibold mt-2 active:bg-rw-btn-hover"
        >
          התחברות
        </button>

      </div>

      <p className="text-sm text-rw-sub mt-6">
        אין לך חשבון?{" "}
        <span
          onClick={() => navigate("/register")}
          className="text-rw-green font-semibold cursor-pointer"
        >
          הרשמה
        </span>
      </p>

    </div>
  );
}