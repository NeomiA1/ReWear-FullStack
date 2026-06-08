import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import BottomNav from "../../components/BottomNav";
import { createDonationBag } from "../../services/donationBagService";

export default function UploadDonationPage() {
  const navigate = useNavigate();
  const { user, addDonation } = useUser();
  const [bags, setBags] = useState([
    { id: 1, size: "", age: "", gender: "", condition: "", description: "", imagePreview: null }
  ]);
  const [uploaded, setUploaded]   = useState(false);
  const [loading,  setLoading]    = useState(false);

  const updateBag = (bagId, field, value) => {
    setBags(bags.map(bag =>
      bag.id === bagId ? { ...bag, [field]: value } : bag
    ));
  };

  const handleImageChange = (bagId, file) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setBags(bags.map(bag =>
      bag.id === bagId ? { ...bag, imagePreview: previewUrl } : bag
    ));
  };

  const addBag = () => {
    setBags([...bags, {
      id: bags.length + 1,
      size: "", age: "", gender: "", condition: "", description: "", imagePreview: null
    }]);
  };

  const deleteBag = (bagId) => {
    if (bags.length === 1) return;
    setBags(bags.filter(bag => bag.id !== bagId));
  };

  const handleUpload = async () => {
    if (!user || !user.userId) {
      // ── דמו: משתמש בלי userId (כניסת דמו) ──────────────────────
      // שומרים ב-Context בלבד ומציגים אישור
      addDonation(bags);
      setUploaded(true);
      return;
    }

    setLoading(true);
    try {
      // ── משתמש אמיתי: שולחים לשרת ───────────────────────────────
      for (const bag of bags) {
        const donationBag = {
          userId:           user.userId,
          shortDescription: bag.description,
          sizes:            bag.size,
          targetAges:       bag.age,
          targetGender:     bag.gender,
          clothesCondition: bag.condition,
        };
        await createDonationBag(donationBag);
      }
      // ✅ A1 תיקון: setUploaded(true) נקרא אחרי הצלחה
      setUploaded(true);
    } catch (error) {
      console.error(error);
      alert("שגיאה בהעלאת השק: " + error);
    } finally {
      setLoading(false);
    }
  };

  const sizeOptions      = ["XS", "S", "M", "L", "XL", "XXL"];
  const ageOptions       = ["תינוקות", "ילדים", "נוער", "מבוגרים", "קשישים"];
  const genderOptions    = ["בנים", "בנות", "יוניסקס"];
  const conditionOptions = ["חדש", "כמו חדש", "תקין", "משומש"];

  if (uploaded) {
    return (
      <div className="min-h-screen bg-rw-bg flex flex-col items-center justify-center px-6 gap-5">
        <span className="text-6xl">✅</span>
        <h2 className="text-xl font-bold text-rw-title">שק הועלה בהצלחה!</h2>
        <p className="text-rw-sub text-sm text-center">
          השק נשמר בפרופיל שלך. עכשיו תוכלי לשלוח אותו לעמותה מתוך הפרופיל.
        </p>
        <div className="flex flex-col gap-3 w-full">
          <button onClick={() => navigate("/profile")}
            className="w-full bg-rw-btn text-white rounded-2xl py-4
                       text-sm font-semibold active:bg-rw-btn-hover">
            מעבר לפרופיל לשליחה לעמותה
          </button>
          <button onClick={() => {
            setUploaded(false);
            setBags([{ id: 1, size: "", age: "", gender: "", condition: "", description: "", imagePreview: null }]);
          }}
            className="w-full border border-rw-border text-rw-sub rounded-2xl py-3 text-sm font-semibold">
            העלאת שק נוסף
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rw-bg pb-28 overflow-y-auto">

      <div className="sticky top-0 bg-rw-bg z-10
                      flex items-center justify-between
                      px-5 py-4 border-b border-rw-border">
        <button onClick={() => navigate("/home")} className="text-rw-sub text-2xl">→</button>
        <h1 className="font-bold text-rw-title text-base">העלאת שק תרומה</h1>
        <div className="w-6" />
      </div>

      <div className="px-5 pt-5 flex flex-col gap-5">

        {bags.map((bag) => (
          <div key={bag.id} className="bg-rw-card rounded-2xl shadow-sm p-4">

            <div className="flex justify-between items-center mb-3">
              <button onClick={() => deleteBag(bag.id)}
                className={`text-xl ${bags.length === 1 ? "opacity-30" : "text-gray-400"}`}>
                🗑️
              </button>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-rw-title text-sm">שק {bag.id}</span>
                <span className="text-xl">🛍️</span>
              </div>
            </div>

            <div className="relative border-2 border-dashed border-rw-border
                            rounded-xl bg-rw-input overflow-hidden
                            flex flex-col items-center justify-center
                            mb-4 cursor-pointer"
                 style={{ minHeight: "120px" }}>
              {bag.imagePreview ? (
                <img src={bag.imagePreview} alt="תצוגה מקדימה"
                  className="w-full h-48 object-cover rounded-xl" />
              ) : (
                <div className="flex flex-col items-center py-10">
                  <span className="text-4xl text-rw-btn mb-2">📷</span>
                  <p className="text-rw-sub text-sm">הוספת תמונה או וידאו</p>
                </div>
              )}
              <input type="file" accept="image/*,video/*"
                onChange={(e) => handleImageChange(bag.id, e.target.files[0])}
                className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { field: "size",      label: "מידה",  options: sizeOptions      },
                { field: "age",       label: "גיל",   options: ageOptions       },
                { field: "gender",    label: "מגדר",  options: genderOptions    },
                { field: "condition", label: "מצב",   options: conditionOptions },
              ].map(({ field, label, options }) => (
                <select key={field} value={bag[field]}
                  onChange={(e) => updateBag(bag.id, field, e.target.value)}
                  className="border border-rw-border rounded-xl px-3 py-2.5
                             text-sm text-right outline-none bg-rw-input
                             focus:border-rw-btn appearance-none text-rw-sub cursor-pointer">
                  <option value="">{label}</option>
                  {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ))}
            </div>

            <textarea value={bag.description}
              onChange={(e) => updateBag(bag.id, "description", e.target.value)}
              placeholder="תיאור קצר של הפריטים בשק (רשות)"
              rows={3}
              className="w-full mt-3 border border-rw-border rounded-xl px-4 py-3
                         text-sm text-right outline-none bg-rw-input
                         focus:border-rw-btn resize-none" />
          </div>
        ))}

        <button onClick={addBag}
          className="w-full border-2 border-dashed border-rw-border
                     rounded-2xl py-4 text-rw-green text-sm font-semibold
                     flex items-center justify-center gap-2 active:bg-rw-input">
          <span>⊕</span><span>הוספת שק נוסף</span>
        </button>

        <button onClick={handleUpload} disabled={loading}
          className="w-full bg-rw-btn text-white rounded-2xl py-4
                     text-sm font-semibold flex items-center justify-center gap-2
                     active:bg-rw-btn-hover mb-4 disabled:opacity-60">
          <span>{loading ? "⏳" : "⬆️"}</span>
          <span>{loading ? "מעלה..." : "העלה שק"}</span>
        </button>

      </div>

      <BottomNav active="donate" />
    </div>
  );
}
