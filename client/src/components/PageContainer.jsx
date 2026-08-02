// מעטפת עמוד משותפת — מחליפה את ה-<div className="min-h-screen bg-rw-bg ...">
// שכל עמוד הגדיר בעצמו בנפרד. אחראית אך ורק על רוחב מקסימלי רספונסיבי
// וריכוז אופקי; לא נוגעת ב-padding הפנימי הקיים של כל עמוד (px-5 וכד'),
// כדי שהעדכון לכל עמוד יישאר שינוי מכני של ה-wrapper בלבד.
//
// wide=true — לעמודי דשבורד/רשימות (בית עמותה/חנות, מפה, פרופיל) שרוצים
// לנצל יותר רוחב במסכים גדולים. wide=false (ברירת מחדל) — לרוב העמודים.
//
// lg:pr-56/xl:pr-64 — משאיר מקום לסיידבר הדסקטופ הקבוע (DesktopSidebar,
// שיושב fixed בצד ימין ב-RTL) כדי שהתוכן לא ייכנס מתחתיו; מרכז את התוכן
// בתוך השטח שנשאר, לא על פני כל רוחב המסך. עמודי אימות (AuthLayout) לא
// עוברים דרך הקומפוננטה הזו כלל, ולכן לא מושפעים מהריפוד הזה.
export default function PageContainer({ children, className = "", wide = false }) {
  const widthClasses = wide
    ? "max-w-[480px] md:max-w-[760px] lg:max-w-[1120px] xl:max-w-[1280px]"
    : "max-w-[480px] md:max-w-[640px] lg:max-w-[760px]";

  return (
    <div className={`min-h-screen bg-rw-bg lg:pr-56 xl:pr-64 ${className}`}>
      <div className={`mx-auto w-full ${widthClasses}`}>
        {children}
      </div>
    </div>
  );
}
