// src/pages/user/ImpactPage.jsx
// מסך אימפקט אישי – מדדי קיימות מחושבים מהתרומות

import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import BottomNav from "../../components/BottomNav";

// קבועי חישוב קיימות (ממוצעים מחקריים)
const KG_PER_BAG        = 3;    // ק"ג ממוצע לשק בגדים
const WATER_PER_KG      = 10;   // אלף ליטר מים לייצור ק"ג בגדים
const CO2_PER_KG        = 15;   // ק"ג CO2 לייצור ק"ג בגדים
const ITEMS_PER_BAG     = 8;    // פריטים ממוצע לשק

function ImpactCard({ icon, value, unit, label, color }) {
  return (
    <div className={`rounded-2xl p-5 flex flex-col items-center gap-2 shadow-sm ${color}`}>
      <span className="text-3xl">{icon}</span>
      <div className="text-center">
        <span className="text-2xl font-bold text-rw-title">{value}</span>
        <span className="text-sm text-rw-sub ml-1">{unit}</span>
      </div>
      <p className="text-xs text-rw-sub text-center leading-relaxed">{label}</p>
    </div>
  );
}

function LevelBadge({ level, completedCount }) {
  const levels = [
    { name: "ברונזה",  min: 0,  max: 1,  emoji: "🥉", color: "bg-amber-100 text-amber-700"   },
    { name: "כסף",     min: 2,  max: 4,  emoji: "🥈", color: "bg-gray-100 text-gray-600"     },
    { name: "זהב",     min: 5,  max: 9,  emoji: "🥇", color: "bg-yellow-100 text-yellow-700" },
    { name: "פלטינה",  min: 10, max: 999,emoji: "💎", color: "bg-blue-100 text-blue-700"     },
  ];
  const current = levels.find(l => completedCount >= l.min && completedCount <= l.max)
                  || levels[0];
  const next    = levels[levels.indexOf(current) + 1];

  return (
    <div className={`rounded-2xl p-4 ${current.color} flex items-center justify-between`}>
      <div className="flex flex-col items-start">
        {next && (
          <p className="text-xs opacity-70">
            עוד {next.min - completedCount} תרומות לרמת {next.name}
          </p>
        )}
        {!next && <p className="text-xs opacity-70">הגעת לרמה הגבוהה ביותר! 🎊</p>}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-end">
          <span className="font-bold text-base">רמת {current.name}</span>
          <span className="text-xs opacity-70">{completedCount} תרומות הושלמו</span>
        </div>
        <span className="text-3xl">{current.emoji}</span>
      </div>
    </div>
  );
}

export default function ImpactPage() {
  const navigate = useNavigate();
  const { sentDonations, donations } = useUser();

  // חישובים
  const completedDonations = (sentDonations || []).filter(d => d.status === "collected");
  const totalBags          = completedDonations.length;
  const totalKg            = totalBags * KG_PER_BAG;
  const waterSaved         = totalKg * WATER_PER_KG;      // אלף ליטר
  const co2Saved           = totalKg * CO2_PER_KG;        // ק"ג CO2
  const itemsRescued       = totalBags * ITEMS_PER_BAG;
  const uploadedBags       = (donations || []).length;
  const pendingBags        = (sentDonations || []).filter(
    d => !["collected","rejected"].includes(d.status)
  ).length;

  return (
    <div className="min-h-screen bg-rw-bg pb-24 overflow-y-auto">

      {/* Header */}
      <div className="sticky top-0 bg-rw-bg z-10
                      flex items-center justify-between
                      px-5 py-4 border-b border-rw-border">
        <button onClick={() => navigate("/home")} className="text-rw-sub text-2xl">→</button>
        <h1 className="font-bold text-rw-title text-base">האימפקט שלי</h1>
        <div className="w-6" />
      </div>

      <div className="px-5 pt-5 flex flex-col gap-5">

        {/* תג רמה */}
        <LevelBadge level="זהב" completedCount={totalBags} />

        {/* סיכום מהיר */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "שקים הועלו",  value: uploadedBags, icon: "⬆️" },
            { label: "בתהליך",      value: pendingBags,  icon: "⏳" },
            { label: "הושלמו",      value: totalBags,    icon: "✅" },
          ].map(stat => (
            <div key={stat.label}
              className="bg-rw-card rounded-2xl p-3 shadow-sm text-center">
              <span className="text-xl">{stat.icon}</span>
              <p className="text-xl font-bold text-rw-title mt-1">{stat.value}</p>
              <p className="text-rw-sub text-[11px]">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* כרטיסי אימפקט סביבתי */}
        <h2 className="font-bold text-rw-title text-base text-right">
          האימפקט הסביבתי שלך
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <ImpactCard
            icon="👗"
            value={itemsRescued}
            unit="פריטים"
            label="פריטי לבוש שהציל מפח האשפה"
            color="bg-rw-card"
          />
          <ImpactCard
            icon="💧"
            value={waterSaved.toLocaleString()}
            unit="ליטר"
            label="מים נחסכו בייצור בגדים חדשים"
            color="bg-blue-50"
          />
          <ImpactCard
            icon="🌿"
            value={co2Saved}
            unit='ק"ג CO₂'
            label="פחמן דו-חמצני שנחסך לאטמוספרה"
            color="bg-green-50"
          />
          <ImpactCard
            icon="♻️"
            value={totalKg}
            unit='ק"ג'
            label="טקסטיל שנכנס לכלכלה המעגלית"
            color="bg-amber-50"
          />
        </div>

        {/* הסבר */}
        <div className="bg-rw-card rounded-2xl p-4 shadow-sm">
          <p className="text-rw-sub text-xs text-right leading-relaxed">
            * החישובים מבוססים על ממוצעים מחקריים:
            ייצור ק"ג בגדים צורך כ-10,000 ליטר מים ומפיק כ-15 ק"ג CO₂.
            כל שק מכיל בממוצע 3 ק"ג ו-8 פריטים.
          </p>
        </div>

        {/* CTA */}
        {totalBags === 0 && (
          <div className="bg-rw-btn/10 rounded-2xl p-5 text-center">
            <p className="text-rw-btn font-semibold text-sm mb-2">
              התחילי לתרום כדי לראות את האימפקט שלך!
            </p>
            <button onClick={() => navigate("/upload")}
              className="bg-rw-btn text-white rounded-xl px-5 py-2.5
                         text-sm font-semibold active:bg-rw-btn-hover">
              העלי שק ראשון
            </button>
          </div>
        )}

      </div>

      <BottomNav active="impact" />
    </div>
  );
}
