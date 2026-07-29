// רכיב גנרי ורב-שימוש להצגת "מסע" אנכי של שלבים — תרומה, בקשת שיתוף פעולה,
// כל תהליך שלב-אחר-שלב. לא יודע כלום על שקים/עמותות/API — מקבל רק steps.
//
// step: { id, icon, title, description, timestamp (string|null), state }
//   state: "completed" | "current" | "upcoming" | "rejected"
//
// שימוש עתידי לעמותות/חנויות: לספק מיפוי steps משלהם (למשל התקדמות שיתוף
// פעולה עם חנות) ולהשתמש באותו רכיב בדיוק.

import { useEffect, useState } from "react";

const STATE_STYLES = {
  completed: {
    circle: "bg-rw-btn border-rw-btn text-white",
    line: "bg-rw-btn",
    title: "text-rw-title",
    desc: "text-rw-sub",
  },
  current: {
    circle: "bg-rw-card border-rw-btn text-rw-btn ring-4 ring-rw-btn/15",
    line: "bg-rw-border",
    title: "text-rw-title",
    desc: "text-rw-sub",
  },
  upcoming: {
    circle: "bg-rw-input border-rw-border text-rw-sub opacity-60",
    line: "bg-rw-border",
    title: "text-rw-sub opacity-70",
    desc: "text-rw-sub opacity-60",
  },
  rejected: {
    circle: "bg-red-400 border-red-400 text-white",
    line: "bg-red-200",
    title: "text-red-500",
    desc: "text-red-400",
  },
};

function computeProgress(steps) {
  if (!steps.length) return 0;
  const completed = steps.filter((s) => s.state === "completed").length;
  return Math.round((completed / steps.length) * 100);
}

export default function DonationJourneyTimeline({
  steps,
  progressPercent,
  title = "מסע התרומה שלך",
  completionMessage = "התרומה הושלמה בהצלחה. תודה שתרמת! 💚",
  rejectedMessage = "הבקשה הזו נדחתה — אפשר לנסות לשלוח את השק לעמותה אחרת.",
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!steps || steps.length === 0) return null;

  const percent = typeof progressPercent === "number" ? progressPercent : computeProgress(steps);
  const lastStep = steps[steps.length - 1];
  const isCompleted = lastStep.state === "completed" && lastStep.id === "completed";
  const isRejected = lastStep.state === "rejected";

  return (
    <div className="rw-journey">
      <style>{`
        .rw-journey .rw-journey-step {
          opacity: 0;
          transform: translateY(6px);
          animation: rw-journey-in 0.4s ease forwards;
        }
        @keyframes rw-journey-in {
          to { opacity: 1; transform: translateY(0); }
        }
        .rw-journey .rw-journey-pulse::before {
          content: "";
          position: absolute;
          inset: -4px;
          border-radius: 9999px;
          border: 2px solid var(--color-rw-btn, #6b8f5e);
          animation: rw-journey-pulse 1.8s ease-out infinite;
        }
        @keyframes rw-journey-pulse {
          0%   { transform: scale(0.9); opacity: 0.6; }
          70%  { transform: scale(1.35); opacity: 0; }
          100% { opacity: 0; }
        }
        .rw-journey .rw-journey-bar {
          transition: width 0.6s ease;
        }
        @media (prefers-reduced-motion: reduce) {
          .rw-journey .rw-journey-step { animation: none; opacity: 1; transform: none; }
          .rw-journey .rw-journey-pulse::before { animation: none; }
          .rw-journey .rw-journey-bar { transition: none; }
        }
      `}</style>

      {/* כותרת + אחוז התקדמות */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-rw-title">{percent}%</span>
        <h3 className="font-bold text-rw-title text-sm">{title}</h3>
      </div>
      <div className="w-full h-1.5 bg-rw-border rounded-full overflow-hidden mb-5">
        <div
          className="rw-journey-bar h-full bg-rw-btn rounded-full"
          style={{ width: `${mounted ? percent : 0}%` }}
        />
      </div>

      {/* שלבים */}
      <div className="flex flex-col">
        {steps.map((step, i) => {
          const styles = STATE_STYLES[step.state] || STATE_STYLES.upcoming;
          const isLast = i === steps.length - 1;
          return (
            <div
              key={step.id}
              className="rw-journey-step flex gap-3"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {/* עמודת עיגול + קו מחבר */}
              <div className="flex flex-col items-center shrink-0">
                <div className={`relative w-10 h-10 rounded-full border-2 flex items-center
                                 justify-center text-base shrink-0 ${styles.circle}
                                 ${step.state === "current" ? "rw-journey-pulse" : ""}`}>
                  <span>{step.icon}</span>
                </div>
                {!isLast && (
                  <div className={`w-0.5 flex-1 min-h-[28px] my-1 rounded-full ${styles.line}`} />
                )}
              </div>

              {/* תוכן */}
              <div className="flex-1 pb-6 text-right">
                <div className="flex items-center justify-end gap-2 flex-wrap">
                  {step.state === "current" && (
                    <span className="text-[10px] font-bold text-rw-btn bg-rw-btn/10
                                     px-2 py-0.5 rounded-full shrink-0">
                      עכשיו
                    </span>
                  )}
                  <span className={`font-semibold text-sm ${styles.title}`}>{step.title}</span>
                </div>
                <p className={`text-xs mt-0.5 ${styles.desc}`}>{step.description}</p>
                {step.timestamp && (
                  <p className="text-[11px] text-rw-sub opacity-60 mt-1">{step.timestamp}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* הודעת סיום / דחייה */}
      {isCompleted && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">🎉</span>
          <p className="text-green-700 text-sm font-semibold text-right flex-1">{completionMessage}</p>
        </div>
      )}
      {isRejected && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">🚫</span>
          <p className="text-red-500 text-sm font-semibold text-right flex-1">{rejectedMessage}</p>
        </div>
      )}
    </div>
  );
}
