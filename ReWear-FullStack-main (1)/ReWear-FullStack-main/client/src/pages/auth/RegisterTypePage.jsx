import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RegisterTypePage() {

  const [userType, setUserType] = useState("");
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!userType) {
      alert("אנא בחרי סוג משתמש");
      return;
    }
    if (userType === "private") navigate("/register/private");
    if (userType === "org")     navigate("/register/org");
    if (userType === "shop")    navigate("/register/shop");
  };

  const options = [
    {
      id: "private",
      title: "משתמש פרטי",
      description: "קנייה ומכירה של בגדים מהארון שלכם",
      icon: "👤",
    },
    {
      id: "org",
      title: "עמותה",
      description: "גיוס תרומות וחלוקת בגדים לקהילה",
      icon: "🤲",
    },
    {
      id: "shop",
      title: "חנות יד שנייה",
      description: "קנייה ומכירה של פריטים יד שנייה",
      icon: "🏪",
    },
  ];

  return (
    // רקע חם בהיר – rw-bg
    <div className="min-h-screen bg-rw-bg flex flex-col items-center justify-center px-6">

      {/* לוגו – ריבוע מעוגל ירוק עם R */}
      <div className="w-16 h-16 rounded-2xl bg-rw-logo flex items-center justify-center mb-5">
        <span className="text-white text-2xl font-bold">R</span>
      </div>

      {/* כותרת – כחול כהה */}
      <h1 className="text-2xl font-bold text-rw-title mb-1">
        ברוכים הבאים ל-ReWear
      </h1>

      {/* תת כותרת – אפור */}
      <p className="text-rw-sub text-sm mb-8">
        איזה סוג משתמש אתם?
      </p>

      {/* 3 כרטיסים */}
      <div className="w-full flex flex-col gap-4">
        {options.map((option) => (
          <div
            key={option.id}
            onClick={() => setUserType(option.id)}
            className={`
              w-full bg-rw-card rounded-2xl p-4
              flex items-center justify-between
              cursor-pointer border-2 transition-all
              ${userType === option.id
                ? "border-rw-btn shadow-md"
                : "border-rw-border shadow-sm"}
            `}
          >
            {/* טקסט ימין */}
            <div className="flex flex-col items-end">
              <span className="font-bold text-rw-title text-base">
                {option.title}
              </span>
              <span className="text-rw-sub text-xs mt-0.5">
                {option.description}
              </span>
            </div>

            {/* אייקון שמאל */}
            <div className="w-10 h-10 rounded-xl bg-rw-input flex items-center justify-center">
              <span className="text-xl">{option.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* כפתור המשך */}
      <button
        onClick={handleContinue}
        className="w-full bg-rw-btn text-white rounded-xl py-3
                   text-sm font-semibold mt-6 active:bg-rw-btn-hover"
      >
        המשך
      </button>

      {/* לינק חזרה */}
      <p className="text-sm text-rw-sub mt-6">
        כבר יש לכם חשבון?{" "}
        <span
          onClick={() => navigate("/")}
          className="text-rw-green font-semibold cursor-pointer"
        >
          התחברו כאן
        </span>
      </p>

    </div>
  );
}