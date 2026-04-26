import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import BottomNav from "../../components/BottomNav";

export default function UploadDonationPage() {

  const navigate = useNavigate();
  // שולפים את addDonation מה-Context
  const { addDonation } = useUser();

  const [bags, setBags] = useState([
    { id: 1, size: "", age: "", gender: "", condition: "", description: "", hasMedia: false }
  ]);

  const updateBag = (bagId, field, value) => {
    setBags(bags.map(bag =>
      bag.id === bagId ? { ...bag, [field]: value } : bag
    ));
  };

  const addBag = () => {
    setBags([...bags, {
      id: bags.length + 1,
      size: "", age: "", gender: "", condition: "", description: "", hasMedia: false
    }]);
  };

  const deleteBag = (bagId) => {
    if (bags.length === 1) return;
    setBags(bags.filter(bag => bag.id !== bagId));
  };

  const validateBags = () => {
    for (let i = 0; i < bags.length; i++) {
      const bag = bags[i];
      const bagNum = i + 1;
      if (!bag.hasMedia)   return { isValid: false, message: `שק ${bagNum}: חובה להעלות תמונה` };
      if (!bag.size)       return { isValid: false, message: `שק ${bagNum}: חובה לבחור מידה` };
      if (!bag.age)        return { isValid: false, message: `שק ${bagNum}: חובה לבחור גיל` };
      if (!bag.gender)     return { isValid: false, message: `שק ${bagNum}: חובה לבחור מגדר` };
      if (!bag.condition)  return { isValid: false, message: `שק ${bagNum}: חובה לבחור מצב` };
    }
    return { isValid: true, message: "" };
  };

  const handleSubmit = () => {
    const { isValid, message } = validateBags();
    if (!isValid) {
      alert(message);
      return;
    }

    // שומרים את השקים ב-Context
    addDonation(bags);

    // מודיעים למשתמש ועוברים לפרופיל
    alert("התרומה נשלחה בהצלחה! 🎉");
    navigate("/profile");
  };

  const sizeOptions      = ["XS", "S", "M", "L", "XL", "XXL"];
  const ageOptions       = ["תינוקות", "ילדים", "נוער", "מבוגרים", "קשישים"];
  const genderOptions    = ["בנים", "בנות", "יוניסקס"];
  const conditionOptions = ["חדש", "כמו חדש", "תקין", "משומש"];

  return (
    <div className="min-h-screen bg-rw-bg pb-28 overflow-y-auto">

      {/* כותרת */}
      <div className="sticky top-0 bg-rw-bg z-10
                      flex items-center justify-between
                      px-5 py-4 border-b border-rw-border">
        <button onClick={() => navigate("/home")} className="text-rw-sub text-2xl">→</button>
        <h1 className="font-bold text-rw-title text-base">העלאת תרומה</h1>
        <div className="w-6"></div>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-5">

        {bags.map((bag) => (
          <div key={bag.id} className="bg-rw-card rounded-2xl shadow-sm p-4">

            {/* כותרת שק */}
            <div className="flex justify-between items-center mb-3">
              <button
                onClick={() => deleteBag(bag.id)}
                className={`text-xl ${bags.length === 1 ? "opacity-30" : "text-gray-400"}`}
              >🗑️</button>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-rw-title text-sm">שק {bag.id}</span>
                <span className="text-xl">🛍️</span>
              </div>
            </div>

            {/* העלאת תמונה */}
            <div className={`relative border-2 border-dashed rounded-xl bg-rw-input
                            flex flex-col items-center justify-center
                            py-10 mb-4 cursor-pointer
                            ${bag.hasMedia ? "border-rw-btn" : "border-rw-border"}`}>
              {bag.hasMedia ? (
                <>
                  <span className="text-4xl mb-2">✅</span>
                  <p className="text-rw-btn text-sm font-semibold">הקובץ הועלה בהצלחה</p>
                </>
              ) : (
                <>
                  <span className="text-4xl text-rw-btn mb-2">📷</span>
                  <p className="text-rw-sub text-sm">הוספת תמונה או וידאו</p>
                  <p className="text-red-400 text-xs mt-1">* חובה</p>
                </>
              )}
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => {
                  if (e.target.files[0]) updateBag(bag.id, "hasMedia", true);
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>

            {/* 4 dropdowns */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { field: "size",      label: "מידה",  options: sizeOptions },
                { field: "age",       label: "גיל",   options: ageOptions },
                { field: "gender",    label: "מגדר",  options: genderOptions },
                { field: "condition", label: "מצב",   options: conditionOptions },
              ].map(({ field, label, options }) => (
                <select
                  key={field}
                  value={bag[field]}
                  onChange={(e) => updateBag(bag.id, field, e.target.value)}
                  className={`border rounded-xl px-3 py-2.5 text-sm text-right
                             outline-none bg-rw-input focus:border-rw-btn
                             appearance-none cursor-pointer
                             ${!bag[field] ? "border-rw-border text-rw-sub"
                                           : "border-rw-btn text-rw-title"}`}
                >
                  <option value="">{label} *</option>
                  {options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ))}
            </div>

            {/* תיאור */}
            <textarea
              value={bag.description}
              onChange={(e) => updateBag(bag.id, "description", e.target.value)}
              placeholder="תיאור קצר של הפריטים בשק (רשות)"
              rows={3}
              className="w-full mt-3 border border-rw-border rounded-xl px-4 py-3
                         text-sm text-right outline-none bg-rw-input
                         focus:border-rw-btn resize-none"
            />
          </div>
        ))}

        {/* הוספת שק */}
        <button
          onClick={addBag}
          className="w-full border-2 border-dashed border-rw-border
                     rounded-2xl py-4 text-rw-green text-sm font-semibold
                     flex items-center justify-center gap-2 active:bg-rw-input"
        >
          <span>⊕</span><span>הוספת שק נוסף</span>
        </button>

        {/* שלח */}
        <button
          onClick={handleSubmit}
          className="w-full bg-rw-btn text-white rounded-2xl py-4
                     text-sm font-semibold flex items-center justify-center gap-2
                     active:bg-rw-btn-hover mb-4"
        >
          <span>▶</span><span>שלח תרומה</span>
        </button>

      </div>

      <BottomNav active="donate" />
    </div>
  );
}