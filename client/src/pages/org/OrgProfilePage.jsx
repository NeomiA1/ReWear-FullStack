import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";

// ─── רכיב Toggle מותאם ───────────────────────────────────
// value = האם דלוק (true/false)
// onChange = פונקציה שנקראת בלחיצה
function Toggle({ value, onChange }) {
  return (
    // div חיצוני – הרקע של ה-toggle
    // transition-colors = אנימציה חלקה בשינוי צבע
    <div
      onClick={onChange}
      className={`w-12 h-6 rounded-full cursor-pointer transition-colors
                  flex items-center px-1
                  ${value ? "bg-rw-btn" : "bg-gray-300"}`}
    >
      {/* העיגול הלבן שזזזז */}
      {/* transition-transform = אנימציה של הזזה */}
      {/* translate-x-6 = זזzzים ימינה כשדלוק */}
      <div className={`w-4 h-4 bg-white rounded-full shadow
                       transition-transform
                       ${value ? "translate-x-6" : "translate-x-0"}`}
      />
    </div>
  );
}

export default function OrgProfilePage() {

  const navigate = useNavigate();
  const { user, updateOrgSettings, getOrgSettings, logout } = useUser();

  // שולפים את שם העמותה מה-localStorage
  const savedUser = JSON.parse(localStorage.getItem("rewear_user") || "{}");
  const orgName = user?.orgName || savedUser?.orgName || "העמותה שלי";

  // שולפים את ההגדרות הקיימות של העמותה
  const currentSettings = getOrgSettings(orgName);

  // ─── STATE של הגדרות ─────────────────────────────────
  // isAvailable = האם העמותה זמינה לקבל תרומות
  const [isAvailable, setIsAvailable] = useState(
    currentSettings.isAvailable
  );

  // acceptsPickup = האם מקבלת בשיטת איסוף מהבית
  const [acceptsPickup, setAcceptsPickup] = useState(
    currentSettings.acceptsPickup
  );

  // acceptsDropoff = האם מקבלת בשיטת הגעה לעמותה
  const [acceptsDropoff, setAcceptsDropoff] = useState(
    currentSettings.acceptsDropoff
  );

  // ─── שמירת הגדרות ────────────────────────────────────
  const handleSave = () => {
    // שומרים ב-Context שמחובר ל-localStorage
    updateOrgSettings(orgName, {
      isAvailable,
      acceptsPickup,
      acceptsDropoff,
    });
    alert("ההגדרות נשמרו בהצלחה ✅");
  };

  // ─── toggle handlers ─────────────────────────────────
  // כל פונקציה הופכת את הערך (true→false, false→true)
  const toggleAvailable  = () => setIsAvailable(prev => !prev);
  const togglePickup     = () => setAcceptsPickup(prev => !prev);
  const toggleDropoff    = () => setAcceptsDropoff(prev => !prev);

  return (
    <div className="min-h-screen bg-rw-bg pb-24 overflow-y-auto">

      {/* ── כותרת ── */}
      <div className="sticky top-0 bg-rw-bg z-10
                      flex items-center justify-between
                      px-5 py-4 border-b border-rw-border">
        <button
          onClick={logout}
          className="text-xs text-rw-sub border border-rw-border
                     rounded-xl px-3 py-1.5"
        >
          התנתקות
        </button>
        <h1 className="font-bold text-rw-title text-base">פרופיל עמותה</h1>
        <button
          onClick={() => navigate("/org/home")}
          className="text-rw-sub text-2xl"
        >
          →
        </button>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-5">

        {/* ── כרטיס פרטי עמותה ── */}
        <div className="bg-rw-card rounded-2xl shadow-sm p-5">

          {/* לוגו + פרטים */}
          <div className="flex items-center gap-4 mb-4">

            {/* לוגו עמותה */}
            <div className="w-16 h-16 rounded-full bg-rw-logo
                            flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {orgName.charAt(0)}
              </span>
            </div>

            {/* פרטים */}
            <div className="flex flex-col items-end flex-1">
              <h2 className="font-bold text-rw-title text-base">
                {orgName}
              </h2>
              <p className="text-rw-sub text-xs mt-0.5">
                {savedUser?.address || "כתובת לא הוגדרה"}
              </p>
              <p className="text-rw-sub text-xs mt-0.5">
                📞 {savedUser?.phone || ""}
              </p>
            </div>
          </div>

          {/* סטטיסטיקות */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-rw-input rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-rw-title">42</p>
              <p className="text-xs text-rw-sub mt-1">תרומות שהתקבלו</p>
            </div>
            <div className="bg-rw-input rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-rw-title">18</p>
              <p className="text-xs text-rw-sub mt-1">תיאומי איסוף</p>
            </div>
          </div>
        </div>

        {/* ── כרטיס הגדרות פעילות ── */}
        <div className="bg-rw-card rounded-2xl shadow-sm p-5">

          <h3 className="font-bold text-rw-title text-sm mb-4 text-right">
            הגדרות פעילות
          </h3>

          <div className="flex flex-col gap-4">

            {/* הגדרה 1: זמינות לתרומות */}
            {/* flex justify-between = טקסט בימין, toggle בשמאל */}
            <div className="flex items-center justify-between">
              <Toggle value={isAvailable} onChange={toggleAvailable} />
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-rw-title">
                  זמינה לקבל תרומות
                </span>
                {/* טקסט קטן שמשתנה לפי הסטטוס */}
                <span className={`text-xs mt-0.5
                  ${isAvailable ? "text-green-500" : "text-red-400"}`}>
                  {isAvailable ? "פעיל – מקבלים תרומות כרגע" : "לא זמינים כרגע"}
                </span>
              </div>
            </div>

            {/* קו הפרדה */}
            <div className="h-px bg-rw-border"></div>

            {/* כותרת: אופן קבלת תרומות */}
            <p className="text-sm font-semibold text-rw-title text-right">
              אופן קבלת תרומות
            </p>

            {/* הגדרה 2: איסוף מהבית */}
            <div className="flex items-center justify-between">
              <Toggle value={acceptsPickup} onChange={togglePickup} />
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-rw-title">
                  איסוף מהבית
                </span>
                <span className="text-xs text-rw-sub mt-0.5">
                  העמותה מגיעה לאסוף מהתורם
                </span>
              </div>
            </div>

            {/* הגדרה 3: הגעה לעמותה */}
            <div className="flex items-center justify-between">
              <Toggle value={acceptsDropoff} onChange={toggleDropoff} />
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-rw-title">
                  הגעה לעמותה
                </span>
                <span className="text-xs text-rw-sub mt-0.5">
                  התורם מביא לעמותה
                </span>
              </div>
            </div>

          </div>

          {/* כפתור שמירה */}
          <button
            onClick={handleSave}
            className="w-full bg-rw-btn text-white rounded-xl py-3
                       text-sm font-semibold mt-5 active:bg-rw-btn-hover"
          >
            שמירת הגדרות
          </button>

        </div>

      </div>

      {/* Navbar */}
      <OrgBottomNav active="profile" />

    </div>
  );
}

// ─── Navbar עמותה ─────────────────────────────────────────
function OrgBottomNav({ active }) {
  const navigate = useNavigate();
  const items = [
    { id: "home",     icon: "🏠", label: "בית",    path: "/org/home" },
    { id: "requests", icon: "📋", label: "בקשות",  path: "/org/requests" },
    { id: "messages", icon: "💬", label: "הודעות", path: "/org/messages" },
    { id: "profile",  icon: "👤", label: "פרופיל", path: "/org/profile" },
  ];
  return (
    <nav className="sticky bottom-0 w-full bg-rw-card border-t border-rw-border
                    flex justify-around items-center py-3 px-4 z-50">
      {items.map((item) => (
        <button key={item.id} onClick={() => navigate(item.path)}
          className="flex flex-col items-center gap-1">
          <span className="text-xl">{item.icon}</span>
          <span className={`text-xs font-semibold
            ${active === item.id ? "text-rw-btn" : "text-rw-sub"}`}>
            {item.label}
          </span>
        </button>
      ))}
    </nav>
  );
}