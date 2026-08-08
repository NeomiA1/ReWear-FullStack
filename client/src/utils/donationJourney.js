

function formatDate(isoString) {
  if (!isoString) return null;
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("he-IL");
}

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