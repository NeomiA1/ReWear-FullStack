import { useEffect, useMemo, useState } from "react";
import { useUser } from "../context/UserContext";
import { ASSOCIATIONS, CAUSES, CATEGORIES } from "../data/associations";
import { rankAssociations, applyFilters, applyDisplaySort } from "../utils/associationRecommendation";
import { getRecoProfile, saveLastFilters } from "../utils/recommendationHistory";

const SORT_OPTIONS = [
  { id: "recommended", label: "מומלץ עבורך" },
  { id: "nearest",     label: "קרוב אליי" },
  { id: "newest",      label: "עמותות חדשות" },
];

// רכיב משותף לבחירת/דפדוף עמותות — משתמש באותו מקור נתונים (ASSOCIATIONS),
// אותו מנוע המלצות (rankAssociations) ואותם פילטרים בכל המסכים שמשתמשים
// בו, כדי שסדר ההמלצה יהיה זהה בכל מקום עבור אותם קלטים.
//
// props:
//   bag        — שק תרומה נבחר (או null אם אין הקשר שק, כמו ב-MapPage)
//   selectedId — מזהה עמותה נבחרת כרגע (להדגשת כרטיס, רשות)
//   onSelect   — (association) => void — נקרא בלחיצה על כרטיס
//   renderAction — (association) => ReactNode — כפתור נוסף לכל כרטיס (רשות)
export default function AssociationRecommendationList({ bag = null, selectedId = null, onSelect, renderAction }) {
  const { user, orgSettings } = useUser();

  const [profile, setProfile] = useState(() => getRecoProfile(user?.userId));
  const [search, setSearch] = useState("");
  const [causesFilter, setCausesFilter] = useState(() => getRecoProfile(user?.userId).lastFilters.causes || []);
  const [categoryFilter, setCategoryFilter] = useState(() => getRecoProfile(user?.userId).lastFilters.category || "all");
  const [availableOnly, setAvailableOnly] = useState(() => getRecoProfile(user?.userId).lastFilters.availableOnly || false);
  const [sortBy, setSortBy] = useState(() => getRecoProfile(user?.userId).lastFilters.sortBy || "recommended");

  // רק אם המשתמש עצמו מתחלף (למשל לוגין/לוגאאוט) טוענים מחדש את הפרופיל.
  useEffect(() => {
    setProfile(getRecoProfile(user?.userId));
  }, [user?.userId]);

  const ranked = useMemo(
    () => rankAssociations(ASSOCIATIONS, { user, bag, profile, orgSettings }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.userId, user?.city, user?.location, bag?.id, bag?.age, profile, orgSettings]
  );

  const filtered = useMemo(
    () => applyFilters(ranked, { search, causesFilter, categoryFilter, availableOnly }),
    [ranked, search, causesFilter, categoryFilter, availableOnly]
  );

  const displayed = useMemo(() => applyDisplaySort(filtered, sortBy), [filtered, sortBy]);

  const persistFilters = (updates) => {
    if (!user?.userId) return;
    saveLastFilters(user.userId, {
      causes: causesFilter,
      category: categoryFilter,
      availableOnly,
      sortBy,
      ...updates,
    });
  };

  const toggleCause = (causeId) => {
    const next = causesFilter.includes(causeId)
      ? causesFilter.filter((c) => c !== causeId)
      : [...causesFilter, causeId];
    setCausesFilter(next);
    persistFilters({ causes: next });
  };

  const handleCategoryChange = (value) => {
    setCategoryFilter(value);
    persistFilters({ category: value });
  };

  const handleAvailableOnlyChange = (value) => {
    setAvailableOnly(value);
    persistFilters({ availableOnly: value });
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    persistFilters({ sortBy: value });
  };

  const clearFilters = () => {
    setSearch("");
    setCausesFilter([]);
    setCategoryFilter("all");
    setAvailableOnly(false);
    persistFilters({ causes: [], category: "all", availableOnly: false });
  };

  const hasActiveFilters = search || causesFilter.length > 0 || categoryFilter !== "all" || availableOnly;

  return (
    <div className="flex flex-col gap-3">
      {/* חיפוש */}
      <input
        type="text"
        placeholder="חיפוש לפי שם עמותה או עיר..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border border-rw-border rounded-xl px-4 py-2.5 text-sm text-right
                   outline-none bg-rw-card focus:border-rw-btn w-full"
      />

      {/* מיון */}
      <div className="flex gap-2">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => handleSortChange(opt.id)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors
              ${sortBy === opt.id
                ? "bg-rw-btn text-white border-rw-btn"
                : "bg-rw-card text-rw-sub border-rw-border"}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* פילטר נושאים */}
      <div className="flex flex-wrap gap-2">
        {CAUSES.map((cause) => (
          <button
            key={cause.id}
            onClick={() => toggleCause(cause.id)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors
              ${causesFilter.includes(cause.id)
                ? "bg-rw-green text-white border-rw-green"
                : "bg-rw-card text-rw-sub border-rw-border"}`}
          >
            {cause.label}
          </button>
        ))}
      </div>

      {/* פילטר קטגוריה + זמינות בלבד */}
      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs text-rw-sub">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => handleAvailableOnlyChange(e.target.checked)}
          />
          זמינות בלבד
        </label>

        <select
          value={categoryFilter}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="border border-rw-border rounded-xl px-3 py-2 text-xs text-right
                     outline-none bg-rw-card focus:border-rw-btn appearance-none text-rw-sub"
        >
          <option value="all">כל הקטגוריות</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* רשימת עמותות */}
      {displayed.length === 0 ? (
        <div className="bg-rw-card rounded-2xl p-5 text-center shadow-sm">
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-rw-sub text-sm">לא נמצאו עמותות התואמות את הסינון</p>
          {hasActiveFilters && (
            <button onClick={clearFilters}
              className="mt-3 text-rw-btn text-sm font-semibold underline">
              נקה סינון
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {displayed.map(({ association: org, percent, reasons, isAvailable }) => (
            <div
              key={org.id}
              onClick={() => onSelect && onSelect(org)}
              className={`bg-rw-card rounded-2xl shadow-sm p-4 flex flex-col gap-2
                         border-2 transition-all
                         ${onSelect ? "cursor-pointer" : ""}
                         ${selectedId === org.id ? "border-rw-btn" : "border-transparent"}`}
            >
              <div className="flex items-center justify-between">
                {selectedId === org.id && <span className="text-rw-btn text-lg">✓</span>}
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-rw-title text-sm">{org.name}</span>
                  <span className="text-[11px] font-bold text-rw-btn bg-rw-btn/10 px-2 py-0.5 rounded-full shrink-0">
                    {percent}% התאמה
                  </span>
                </div>
              </div>

              <span className="text-xs text-rw-sub text-right">📍 {org.city} · {org.area}</span>
              <span className="text-xs text-rw-sub text-right">{org.types}</span>

              {reasons.length > 0 && (
                <div className="border-t border-rw-border pt-2 mt-1 flex flex-col gap-1 items-end">
                  <span className="text-[10px] font-bold text-rw-sub">למה המלצנו על זה?</span>
                  {reasons.map((reason) => (
                    <span key={reason.id} className="text-[11px] text-rw-green text-right
                                                      flex items-center gap-1.5 justify-end">
                      <span>{reason.text}</span>
                      <span className="shrink-0">{reason.icon}</span>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2 justify-end mt-1 items-center">
                {renderAction && (
                  <span onClick={(e) => e.stopPropagation()}>{renderAction(org)}</span>
                )}
                <span className={`text-xs px-2 py-1 rounded-full font-medium
                  ${isAvailable ? "bg-green-50 text-green-600" : "bg-red-50 text-red-400"}`}>
                  {isAvailable ? "✓ זמינה לתרומות" : "✗ לא זמינה כרגע"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
