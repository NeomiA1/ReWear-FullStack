import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import BottomNav from "../../components/BottomNav";
import PageContainer from "../../components/PageContainer";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import { createDonationBag, uploadBagMedia } from "../../services/donationBagService";
import { getBagCategory } from "../../utils/associationRecommendation";
import { recordDonatedCategory } from "../../utils/recommendationHistory";
import { validateDonationImage, MAX_IMAGES } from "../../utils/imageValidation";
import { useToast } from "../../hooks/useToast";

const EMPTY_BAG = () => ({
  size: "", age: "", gender: "", condition: "", description: "",
  imagePreview: null, imageFile: null, imageError: null, descriptionError: null,
});

const MIN_DESCRIPTION_LENGTH = 5;

// בדיקה של שדה התיאור בלבד — טרימינג לפני הבדיקה, ומחזירה הודעה בעברית
// אם יש פחות מ-5 תווים שאינם רווחים, או null אם תקין.
const getDescriptionError = (description) => {
  const trimmed = (description || "").trim();
  return trimmed.length < MIN_DESCRIPTION_LENGTH
    ? "יש להזין תיאור של לפחות 5 תווים"
    : null;
};

export default function UploadDonationPage() {
  const navigate = useNavigate();
  const { user, addDonation } = useUser();
  const [bags, setBags] = useState([{ id: 1, ...EMPTY_BAG() }]);
  const [uploaded, setUploaded]   = useState(false);
  const [loading,  setLoading]    = useState(false);
  const { confirm, confirmDialogProps } = useConfirmDialog();
  const toast = useToast();
  const bagsRef = useRef(bags);
  useEffect(() => { bagsRef.current = bags; }, [bags]);
  useEffect(() => {
    return () => {
      bagsRef.current.forEach((bag) => {
        if (bag.imagePreview) URL.revokeObjectURL(bag.imagePreview);
      });
    };
  }, []);

  const updateBag = (bagId, field, value) => {
    setBags(bags.map(bag => {
      if (bag.id !== bagId) return bag;
      const next = { ...bag, [field]: value };
      // אם כבר מוצגת שגיאת תיאור, מעדכנים אותה באופן חי בזמן הקלדה
      // כדי שהיא תיעלם ברגע שהתיאור הופך תקין — לא מציגים שגיאה חדשה
      // באופן פרואקטיבי על שדה שעדיין לא נבדק.
      if (field === "description" && bag.descriptionError) {
        next.descriptionError = getDescriptionError(value);
      }
      return next;
    }));
  };

  const handleDescriptionBlur = (bagId, description) => {
    setBags((prev) => prev.map((b) =>
      b.id === bagId ? { ...b, descriptionError: getDescriptionError(description) } : b
    ));
  };

  const handleImageChange = async (bagId, file) => {
    if (!file) return;

    const existingFiles = bags
      .filter((b) => b.id !== bagId)
      .map((b) => b.imageFile)
      .filter(Boolean);

    const validationMessage = await validateDonationImage(file, existingFiles);

    if (validationMessage) {
      setBags((prev) => prev.map((b) =>
        b.id === bagId ? { ...b, imageError: validationMessage } : b
      ));
      return;
    }

    setBags((prev) => prev.map((b) => {
      if (b.id !== bagId) return b;
      if (b.imagePreview) URL.revokeObjectURL(b.imagePreview); // מחליפים תמונה — משחררים את הישנה
      return { ...b, imagePreview: URL.createObjectURL(file), imageFile: file, imageError: null };
    }));
  };

  const removeImage = (bagId) => {
    setBags((prev) => prev.map((b) => {
      if (b.id !== bagId) return b;
      if (b.imagePreview) URL.revokeObjectURL(b.imagePreview);
      return { ...b, imagePreview: null, imageFile: null, imageError: null };
    }));
  };

  const handleRemoveImageClick = (bagId) => {
    confirm({
      title: "הסרת תמונה",
      message: "להסיר את התמונה שנבחרה לשק הזה?",
      confirmText: "הסר/י תמונה",
      cancelText: "ביטול",
      destructive: true,
      icon: "🖼️",
      onConfirm: () => removeImage(bagId),
    });
  };

  const addBag = () => {
    if (bags.length >= MAX_IMAGES) return;
    setBags([...bags, { id: bags.length + 1, ...EMPTY_BAG() }]);
  };

  const deleteBagReal = (bagId) => {
    setBags((prev) => {
      const target = prev.find((b) => b.id === bagId);
      if (target?.imagePreview) URL.revokeObjectURL(target.imagePreview);
      return prev.filter((b) => b.id !== bagId);
    });
  };

  const handleDeleteBagClick = (bagId) => {
    if (bags.length === 1) return;
    confirm({
      title: "מחיקת שק",
      message: "האם למחוק את השק הזה? הפעולה אינה הפיכה.",
      confirmText: "מחק/י שק",
      cancelText: "ביטול",
      destructive: true,
      icon: "🗑️",
      onConfirm: () => deleteBagReal(bagId),
    });
  };

  const hasUnsavedData = bags.some((b) =>
    b.size || b.age || b.gender || b.condition || b.description.trim() || b.imageFile
  );

  const handleBack = () => {
    if (!hasUnsavedData) {
      navigate("/home");
      return;
    }
    confirm({
      title: "לצאת בלי לשמור?",
      message: "מילאת פרטי תרומה שעדיין לא נשמרו. אם תצא/י עכשיו הם יימחקו.",
      confirmText: "צא/י בלי לשמור",
      cancelText: "המשך/י למלא",
      destructive: true,
      icon: "⚠️",
      onConfirm: () => navigate("/home"),
    });
  };

  const validateBags = () => {
    for (let i = 0; i < bags.length; i++) {
      const bag = bags[i];
      if (!bag.size || !bag.gender || !bag.condition) {
        return `שק ${i + 1}: יש למלא מידה, מגדר ומצב בגדים`;
      }
      if (!bag.imageFile) {
        return `שק ${i + 1}: יש להוסיף לפחות תמונה אחת`;
      }
    }
    return null;
  };

  const handleUpload = async () => {
    // בדיקת תיאור — מוצגת מוטבעת בשדה, לא ב-Toast, ולא ניתן לשלוח
    // את הבקשה לשרת כל עוד יש שק עם תיאור לא תקין.
    const descriptionErrors = bags.map((bag) => getDescriptionError(bag.description));
    if (descriptionErrors.some(Boolean)) {
      setBags((prev) => prev.map((bag, i) => ({ ...bag, descriptionError: descriptionErrors[i] })));
      return;
    }

    const validationError = validateBags();
    if (validationError) {
      toast.warning(validationError);
      return;
    }

    if (!user || !user.userId) {
    
      addDonation(bags);
      setUploaded(true);
      return;
    }

    setLoading(true);
    try {

      for (const bag of bags) {
        const donationBag = {
          userId:           user.userId,
          shortDescription: bag.description,
          sizes:            bag.size,
          targetAges:       bag.age,
          targetGender:     bag.gender,
          clothesCondition: bag.condition,
        };
        const created = await createDonationBag(donationBag);

        // רק אחרי ששני השלבים הצליחו (יצירת השק + העלאת התמונה)
        // השק נחשב הושלם. אם ההעלאה נכשלת עוצרים מיד ולא ממשיכים
        // לשק הבא, כדי לא להשאיר חלק מהשקים בלי תמונה.
        try {
          await uploadBagMedia(created.bagId, bag.imageFile);
        } catch (uploadError) {
          throw new Error(
            `השק נשמר אך העלאת התמונה נכשלה: ${uploadError}. נסה/י שוב.`
          );
        }

        recordDonatedCategory(user.userId, getBagCategory(bag));
      }

      setUploaded(true);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "שגיאה בהעלאת השק: " + error
      );
    } finally {
      setLoading(false);
    }
  };

  const sizeOptions      = ["XS", "S", "M", "L", "XL", "XXL"];
  const ageOptions       = ["תינוקות", "ילדים", "נוער", "מבוגרים", "קשישים"];
  const genderOptions    = ["בנים", "בנות", "יוניסקס"];
  const conditionOptions = ["חדש", "כמו חדש", "תקין", "משומש"];

  const imagesSelectedCount = bags.filter((b) => b.imageFile).length;
  const remainingSlots = Math.max(0, MAX_IMAGES - bags.length);
  const canSubmit = !loading && bags.every((b) => b.imageFile);

  if (uploaded) {
    return (
      <div className="min-h-screen bg-rw-bg flex flex-col items-center justify-center px-6 gap-5">
        <span className="text-6xl">✅</span>
        <h2 className="text-xl font-bold text-rw-title">שק הועלה בהצלחה!</h2>
        <p className="text-rw-sub text-sm text-center">
          השק נשמר בפרופיל שלך. עכשיו תוכל/י לשלוח אותו לעמותה מתוך הפרופיל.
        </p>
        <div className="flex flex-col gap-3 w-full">
          <button onClick={() => navigate("/profile")}
            className="w-full bg-rw-btn text-white rounded-2xl py-4
                       text-sm font-semibold active:bg-rw-btn-hover">
            מעבר לפרופיל לשליחה לעמותה
          </button>
          <button onClick={() => {
            setUploaded(false);
            setBags([{ id: 1, ...EMPTY_BAG() }]);
          }}
            className="w-full border border-rw-border text-rw-sub rounded-2xl py-3 text-sm font-semibold">
            העלאת שק נוסף
          </button>
        </div>
      </div>
    );
  }

  return (
    <PageContainer className="pb-24 overflow-y-auto" wide>

      <div className="sticky top-0 bg-rw-bg z-10
                      flex items-center justify-between
                      px-5 py-4 border-b border-rw-border">
        <button onClick={handleBack} className="text-rw-sub text-2xl">→</button>
        <h1 className="font-bold text-rw-title text-base">העלאת שק תרומה</h1>
        <div className="w-6" />
      </div>

      <div className="px-5 pt-5 flex flex-col gap-5">

        {bags.map((bag) => (
          <div key={bag.id} className="bg-rw-card rounded-2xl shadow-sm p-4">

            <div className="flex justify-between items-center mb-3">
              <button onClick={() => handleDeleteBagClick(bag.id)}
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
                            cursor-pointer"
                 style={{ minHeight: "120px" }}>
              {bag.imagePreview ? (
                <img src={bag.imagePreview} alt="תצוגה מקדימה"
                  className="w-full h-48 object-cover rounded-xl" />
              ) : (
                <div className="flex flex-col items-center py-10">
                  <span className="text-4xl text-rw-btn mb-2">📷</span>
                  <p className="text-rw-sub text-sm">הוספת תמונה</p>
                  <p className="text-rw-sub text-[11px] mt-1">JPG · PNG · WEBP, עד 5MB</p>
                </div>
              )}
              <input type="file" accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleImageChange(bag.id, e.target.files[0])}
                className="absolute inset-0 opacity-0 cursor-pointer" />
              {bag.imagePreview && (
                <button type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveImageClick(bag.id); }}
                  aria-label="הסרת תמונה"
                  className="absolute top-2 left-2 z-10 w-7 h-7 bg-black/60 text-white
                             rounded-full flex items-center justify-center text-sm">
                  ✕
                </button>
              )}
            </div>

            {bag.imageError && (
              <p className="text-red-500 text-xs text-right mt-1.5">{bag.imageError}</p>
            )}

            <div className="grid grid-cols-2 gap-3 mt-3">
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
              onBlur={(e) => handleDescriptionBlur(bag.id, e.target.value)}
              placeholder="תיאור קצר של הפריטים בשק"
              rows={3}
              className={`w-full mt-3 border rounded-xl px-4 py-3
                         text-sm text-right outline-none bg-rw-input
                         focus:border-rw-btn resize-none
                         ${bag.descriptionError ? "border-red-400" : "border-rw-border"}`} />
            {bag.descriptionError && (
              <p className="text-red-500 text-xs text-right mt-1.5">{bag.descriptionError}</p>
            )}
          </div>
        ))}

        <div className="text-center">
          <p className="text-rw-sub text-xs">
            {imagesSelectedCount} מתוך {MAX_IMAGES} תמונות נבחרו
            {remainingSlots > 0 && ` · אפשר להוסיף עוד ${remainingSlots}`}
          </p>
          {bags.length >= MAX_IMAGES && (
            <p className="text-rw-sub text-[11px] mt-0.5">ניתן להעלות עד {MAX_IMAGES} תמונות</p>
          )}
        </div>

        <button onClick={addBag} disabled={bags.length >= MAX_IMAGES}
          className="w-full border-2 border-dashed border-rw-border
                     rounded-2xl py-4 text-rw-green text-sm font-semibold
                     flex items-center justify-center gap-2 active:bg-rw-input
                     disabled:opacity-40 disabled:cursor-not-allowed">
          <span>⊕</span><span>הוספת שק נוסף</span>
        </button>

        <button onClick={handleUpload} disabled={!canSubmit}
          className="w-full bg-rw-btn text-white rounded-2xl py-4
                     text-sm font-semibold flex items-center justify-center gap-2
                     active:bg-rw-btn-hover mb-4 disabled:opacity-60">
          <span>{loading ? "⏳" : "⬆️"}</span>
          <span>{loading ? "מעלה..." : "העלה/י שק"}</span>
        </button>

      </div>

      <ConfirmDialog {...confirmDialogProps} />
      <BottomNav active="donate" />
    </PageContainer>
  );
}
