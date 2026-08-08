import { Navigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { ROLES, homeRouteForRole } from "../utils/roles";

// שומר ניתוב מרוכז — מחליף את בדיקות ה-guard המפוזרות שהיו קודם בדפים
// נפרדים (HomePage/OrgHomePage), ומכסה גם דפים שלא היה להם guard בכלל.
// allowedRoles: מחרוזת יחידה ("private") או מערך ("['org','shop']") של
// סוגי המשתמש המורשים למסך הזה.
export default function RequireAuth({ allowedRoles, children }) {
  const { user } = useUser();
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  // לא מחוברת כלל — למסך ההתחברות (אין נתיב "/login" נפרד באפליקציה הזו,
  // LoginPage מותקן ישירות על "/").
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // מחוברת אבל לתפקיד הלא נכון — לדף הבית של התפקיד שלה, לא להתחברות.
  // אם user.type הוא ערך לא מוכר (לא אמור לקרות בפועל — ראו roles.js),
  // חוזרות ל"/" במקום לנסות home-route שעלול ליצור לולאת ניתוב.
  if (!roles.includes(user.type)) {
    if (!ROLES.includes(user.type)) {
      return <Navigate to="/" replace />;
    }
    return <Navigate to={homeRouteForRole(user.type)} replace />;
  }

  return children;
}
