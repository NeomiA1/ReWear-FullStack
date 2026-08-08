// בניית "מסע התרומה" של שק בודד — ממפה נתונים אמיתיים בלבד (bag.status,
// bag.createdAt מהשרת + רשומת שליחה מקומית אמיתית מ-donationSendLog.js)
// לרשימת שלבים שמוצגת ע"י הרכיב הגנרי DonationJourneyTimeline.jsx.
//
// עקרון: כל שלב שמוצג כ-"הושלם" חייב להתבסס על אות אמיתי. שלבים שהשרת לא
// יכול להבחין ביניהם (נאסף / התקבל בעמותה / חולק הלאה — כולם מתכנסים ל-
// סטטוס "Completed" יחיד) מוצגים יחד כקבוצה שמתעדכנת בו-זמנית, בלי תאריך
// בדוי לכל אחד בנפרד. שלב "הועבר לחנות שותפה" מושמט כברירת מחדל — אין שום
// מקור נתונים שיודע להעיד עליו כרגע (זו בדיוק ההתנהגות של "שלב רשות" שמדלג
// על עצמו כשאין לו על מה להתבסס).

function formatDate(isoString) {
  if (!isoString) return null;
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("he-IL");
}

// שלב 1–3 תמיד קיימים ברגע שהשק "יצא לדרך"; 4–5 תלויים בסטטוס האמיתי;
// 6–9 מתכנסים יחד כשמגיעים ל-Completed (ראו הסבר למעלה).
export function buildDonationJourney(bag, sendRecord) {
  const status = bag?.status || "Draft";
  const uploadedAt = formatDate(bag?.createdAt);
  const orgName = sendRecord?.associationName || null;
  const sentAt = formatDate(sendRecord?.sentAt);

  const steps = [
    {
      id: "uploaded",
      icon: "📦",
      title: "שק תרומה הועלה",
      description: "השק נשמר בהצלחה בפרופיל שלך",
      timestamp: uploadedAt,
      state: "completed",
    },
  ];

  const wasSent = status !== "Draft" && status !== "Published";

  if (!wasSent) {
    steps.push({
      id: "association_selected",
      icon: "🤝",
      title: "בחירת עמותה",
      description: "בחר/י עמותה ושלח/י אליה את השק כדי להתחיל את המסע",
      timestamp: null,
      state: "current",
    });
    return finalize(steps);
  }

  steps.push({
    id: "association_selected",
    icon: "🤝",
    title: "עמותה נבחרה",
    description: orgName ? `בחרת ב${orgName} לתרומה הזו` : "עמותה נבחרה לתרומה הזו",
    timestamp: sentAt,
    state: "completed",
  });

  steps.push({
    id: "request_sent",
    icon: "📤",
    title: "בקשת תרומה נשלחה",
    description: orgName ? `הבקשה נשלחה ל${orgName} וממתינה לתגובה` : "הבקשה נשלחה וממתינה לתגובת העמותה",
    timestamp: sentAt,
    state: status === "WaitingForAssociation" ? "current" : "completed",
  });

  if (status === "Rejected") {
    steps.push({
      id: "rejected",
      icon: "🚫",
      title: "הבקשה נדחתה",
      description: orgName ? `${orgName} לא יכלה לקבל את התרומה הפעם` : "העמותה לא יכלה לקבל את התרומה הפעם",
      timestamp: null,
      state: "rejected",
    });
    return finalize(steps);
  }

  const approvedOrLater = ["Accepted", "PickupScheduled", "Completed"].includes(status);
  steps.push({
    id: "approved",
    icon: "✅",
    title: "העמותה אישרה",
    description: orgName ? `${orgName} אישרה את בקשת התרומה` : "העמותה אישרה את בקשת התרומה",
    timestamp: null,
    state: status === "Accepted" ? "current" : approvedOrLater ? "completed" : "upcoming",
  });

  const scheduledOrLater = ["PickupScheduled", "Completed"].includes(status);
  steps.push({
    id: "pickup_scheduled",
    icon: "📅",
    title: "תואם איסוף",
    description: "נקבע מועד לאיסוף השק ממך",
    timestamp: null,
    state: status === "PickupScheduled" ? "current" : status === "Completed" ? "completed" : "upcoming",
  });

  // ── שלבים שהשרת לא מבחין ביניהם — מתכנסים יחד ל-"הושלם" ────────────────
  const finalState = status === "Completed" ? "completed" : "upcoming";
  steps.push(
    { id: "collected", icon: "🚚", title: "השק נאסף", description: "השק נאסף מהמיקום שלך", timestamp: null, state: finalState },
    { id: "received_by_association", icon: "🏢", title: "התקבל בעמותה", description: "העמותה קיבלה וסיווגה את הפריטים", timestamp: null, state: finalState },
    { id: "sold_or_donated", icon: "👕", title: "חולק הלאה", description: "הפריטים הגיעו למי שזקוק להם", timestamp: null, state: finalState },
    { id: "completed", icon: "🎉", title: "התרומה הושלמה", description: "מסע התרומה שלך הושלם. תודה שתרמת! 💚", timestamp: null, state: finalState },
  );

  return finalize(steps);
}

function finalize(steps) {
  const completedCount = steps.filter((s) => s.state === "completed").length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);
  return { steps, progressPercent };
}