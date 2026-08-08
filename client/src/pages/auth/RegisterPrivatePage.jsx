import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { registerUser, loginUser } from "../../services/userService";
import AuthLayout from "../../components/AuthLayout";
import { useToast } from "../../hooks/useToast";

export default function RegisterPrivatePage() {

  const [fullName, setFullName] = useState("");
  const [email, setEmail]       = useState("");
  const [phone, setPhone]       = useState("");
  const [password, setPassword] = useState("");
  const [location, setLocation] = useState("");

  const { setUser } = useUser();
  const navigate    = useNavigate();
  const toast       = useToast();

  const handleRegister = async () => {
    if (!fullName || !email || !phone || !password) {
      toast.warning("אנא מלא/י את כל השדות");
      return;
    }

    if (password.length < 6) {
      toast.warning("הסיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }

    try {

      const newUser = {
        fullName,
        username: email,
        email,
        password,
        phone,
        city: location,
        registrationMethod: "Email"
      };

      await registerUser(newUser);

      // /api/users/register מחזיר רק הודעת הצלחה,
      // לכן לאחר ההרשמה מבצעים login כדי לקבל את המשתמש האמיתי עם userId.
      const loggedInUser = await loginUser({
        email,
        password
      });

      setUser({
        ...loggedInUser,
        type: "private"
      });

      // שלב onboarding — בחירת נושאי תרומה מועדפים
      navigate("/register/private/causes");

    } catch (error) {

      console.error(error);

      toast.error(
        typeof error === "string"
          ? error
          : "שגיאה בהרשמה. אנא נסה/י שוב."
      );

    }
  };

  // התחברות חברתית טרם ממומשת בצד השרת — כפתורים ללא פעולה בינתיים.
  const handleFacebook  = () => {};
  const handleInstagram = () => {};
  const handleGoogle    = () => {};

  return (
    <AuthLayout>

      {/* חץ חזרה */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => navigate("/register")}
          className="text-rw-sub text-2xl"
        >
          →
        </button>
      </div>

      {/* לוגו */}
      <div className="w-14 h-14 rounded-2xl bg-rw-logo flex items-center
                      justify-center mx-auto mb-4">
        <span className="text-white text-xl font-bold">
          R
        </span>
      </div>

      {/* כותרת */}
      <h1 className="text-xl font-bold text-rw-title text-center mb-6">
        הרשמה למשתמש פרטי
      </h1>

      {/* טופס */}
      <div className="bg-rw-card rounded-2xl shadow-sm p-6 flex flex-col gap-5">

        <div className="flex flex-col gap-1">
          <label className="text-sm text-rw-sub text-right">
            שם מלא
          </label>

          <input
            type="text"
            placeholder="הכנס שם מלא"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="border border-rw-border rounded-xl px-4 py-3
                       text-sm text-right outline-none bg-rw-input focus:border-rw-btn"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-rw-sub text-right">
            אימייל
          </label>

          <input
            type="email"
            placeholder="example@mail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            dir="ltr"
            className="border border-rw-border rounded-xl px-4 py-3
                       text-sm text-left outline-none bg-rw-input focus:border-rw-btn"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-rw-sub text-right">
            טלפון
          </label>

          <input
            type="tel"
            placeholder="050-0000000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            dir="ltr"
            className="border border-rw-border rounded-xl px-4 py-3
                       text-sm text-left outline-none bg-rw-input focus:border-rw-btn"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-rw-sub text-right">
            סיסמה
          </label>

          <input
            type="password"
            placeholder="מינימום 6 תווים"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-rw-border rounded-xl px-4 py-3
                       text-sm text-right outline-none bg-rw-input focus:border-rw-btn"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-rw-sub text-right">
            מיקום (רשות)
          </label>

          <input
            type="text"
            placeholder="עיר / כתובת"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="border border-rw-border rounded-xl px-4 py-3
                       text-sm text-right outline-none bg-rw-input focus:border-rw-btn"
          />
        </div>

        <button
          onClick={handleRegister}
          className="w-full bg-rw-btn text-white rounded-xl py-3
                     text-sm font-semibold mt-2 active:bg-rw-btn-hover"
        >
          הרשמה
        </button>

      </div>

      {/* מפריד */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-rw-border"></div>

        <span className="text-rw-sub text-sm">
          או הירשם/י עם
        </span>

        <div className="flex-1 h-px bg-rw-border"></div>
      </div>

      {/* סושיאל */}
      <div className="flex flex-col gap-3 mb-8">

        <button
          onClick={handleGoogle}
          className="w-full bg-rw-card border border-rw-border text-rw-title rounded-xl py-3
                     text-sm font-semibold flex items-center justify-center gap-2 active:bg-rw-input"
        >
          <span
            className="font-bold text-base"
            style={{
              background:
                "linear-gradient(to right, #4285F4, #EA4335, #FBBC05, #34A853)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}
          >
            G
          </span>

          <span>המשך עם Google</span>
        </button>

        <button
          onClick={handleFacebook}
          className="w-full bg-blue-50 border border-blue-100 text-blue-600 rounded-xl py-3
                     text-sm font-semibold flex items-center justify-center gap-2 active:bg-blue-100"
        >
          <span className="font-bold text-base">
            f
          </span>

          <span>המשך עם Facebook</span>
        </button>

        <button
          onClick={handleInstagram}
          className="w-full bg-pink-50 border border-pink-100 text-pink-500 rounded-xl py-3
                     text-sm font-semibold flex items-center justify-center gap-2 active:bg-pink-100"
        >
          <span className="text-base">
            📷
          </span>

          <span>המשך עם Instagram</span>
        </button>

      </div>

      <p className="text-sm text-rw-sub text-center mb-8">
        כבר יש לך חשבון?{" "}
        <span
          onClick={() => navigate("/")}
          className="text-rw-green font-semibold cursor-pointer"
        >
          התחברות
        </span>
      </p>

    </AuthLayout>
  );
}