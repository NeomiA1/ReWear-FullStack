function formatDate(isoString) {
  if (!isoString) return null;

  const d = new Date(isoString);

  if (Number.isNaN(d.getTime())) {
    return null;
  }

  return d.toLocaleDateString("he-IL");
}

export function buildDonationJourney(bag, sendRecord) {
  /*
   * סטטוס אמיתי מהשרת.
   * DonationStatus מה-C# מגיע ל-React בתור donationStatus.
   */
  const status =
    bag?.donationStatus ||
    bag?.status ||
    "Draft";

  const uploadedAt =
    formatDate(bag?.createdAt);

  const orgName =
    sendRecord?.associationName || null;

  const sentAt =
    formatDate(sendRecord?.sentAt);

  const steps = [
    {
      id: "uploaded",
      icon: "📦",
      title: "שק תרומה הועלה",
      description:
        "השק נשמר בהצלחה בפרופיל שלך",
      timestamp: uploadedAt,
      state: "completed",
    },
  ];

  /*
   * התיקון החשוב:
   *
   * השק נחשב כנשלח אם:
   * 1. יש רשומת שליחה מקומית
   * או
   * 2. הסטטוס בשרת כבר התקדם
   */
  const wasSent =
    Boolean(sendRecord) ||
    (
      status !== "Draft" &&
      status !== "Published"
    );

  /*
   * עדיין לא נשלח
   */
  if (!wasSent) {
    steps.push({
      id: "association_selected",
      icon: "🤝",
      title: "בחירת עמותה",
      description:
        "בחר/י עמותה ושלח/י אליה את השק כדי להתחיל את המסע",
      timestamp: null,
      state: "current",
    });

    return finalize(steps);
  }

  /*
   * עמותה נבחרה
   */
  steps.push({
    id: "association_selected",
    icon: "🤝",
    title: "עמותה נבחרה",
    description: orgName
      ? `בחרת ב${orgName} לתרומה הזו`
      : "עמותה נבחרה לתרומה הזו",
    timestamp: sentAt,
    state: "completed",
  });

  /*
   * הבקשה נשלחה.
   *
   * אם עדיין קיבלנו Draft מהשרת אבל יש sendRecord,
   * אנחנו מציגים שהבקשה נשלחה וממתינה לעמותה.
   */
  const waitingForAssociation =
    status === "WaitingForAssociation" ||
    (
      Boolean(sendRecord) &&
      (
        status === "Draft" ||
        status === "Published"
      )
    );

  steps.push({
    id: "request_sent",
    icon: "📤",
    title: "בקשת תרומה נשלחה",
    description: orgName
      ? `הבקשה נשלחה ל${orgName} וממתינה לתגובה`
      : "הבקשה נשלחה וממתינה לתגובת העמותה",
    timestamp: sentAt,
    state: waitingForAssociation
      ? "current"
      : "completed",
  });

  /*
   * דחיית הבקשה
   */
  if (status === "Rejected") {
    steps.push({
      id: "rejected",
      icon: "🚫",
      title: "הבקשה נדחתה",
      description: orgName
        ? `${orgName} לא יכלה לקבל את התרומה הפעם`
        : "העמותה לא יכלה לקבל את התרומה הפעם",
      timestamp: null,
      state: "rejected",
    });

    return finalize(steps);
  }

  /*
   * העמותה אישרה
   */
  const approvedOrLater = [
    "Accepted",
    "PickupScheduled",
    "Completed",
  ].includes(status);

  steps.push({
    id: "approved",
    icon: "✅",
    title: "העמותה אישרה",
    description: orgName
      ? `${orgName} אישרה את בקשת התרומה`
      : "העמותה אישרה את בקשת התרומה",
    timestamp: null,

    state:
      status === "Accepted"
        ? "current"
        : approvedOrLater
          ? "completed"
          : "upcoming",
  });

  /*
   * תיאום איסוף
   */
  steps.push({
    id: "pickup_scheduled",
    icon: "📅",
    title: "תואם איסוף",
    description:
      "נקבע מועד לאיסוף השק ממך",
    timestamp: null,

    state:
      status === "PickupScheduled"
        ? "current"
        : status === "Completed"
          ? "completed"
          : "upcoming",
  });

  /*
   * שלבים אחרונים.
   * כרגע Completed מסמן את השלמת המסע.
   */
  const finalState =
    status === "Completed"
      ? "completed"
      : "upcoming";

  steps.push(
    {
      id: "collected",
      icon: "🚚",
      title: "השק נאסף",
      description:
        "השק נאסף מהמיקום שלך",
      timestamp: null,
      state: finalState,
    },

    {
      id: "received_by_association",
      icon: "🏢",
      title: "התקבל בעמותה",
      description:
        "העמותה קיבלה וסיווגה את הפריטים",
      timestamp: null,
      state: finalState,
    },

    {
      id: "sold_or_donated",
      icon: "👕",
      title: "חולק הלאה",
      description:
        "הפריטים הגיעו למי שזקוק להם",
      timestamp: null,
      state: finalState,
    },

    {
      id: "completed",
      icon: "🎉",
      title: "התרומה הושלמה",
      description:
        "מסע התרומה שלך הושלם. תודה שתרמת! 💚",
      timestamp: null,
      state: finalState,
    }
  );

  return finalize(steps);
}

function finalize(steps) {
  const completedCount =
    steps.filter(
      (step) =>
        step.state === "completed"
    ).length;

  const progressPercent =
    Math.round(
      (completedCount / steps.length) * 100
    );

  return {
    steps,
    progressPercent,
  };
}