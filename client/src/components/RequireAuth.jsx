import { Navigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

// שומר ניתוב מרוכז — מחליף את בדיקות ה-guard המפוזרות שהיו קודם בדפים
// נפרדים (HomePage/OrgHomePage), וכעת מכסה גם דפים שלא היה להם guard בכלל.
// type קובע איזה סוג משתמש מורשה למסך הזה: "private" | "org" | "shop".
export default function RequireAuth({ type, children }) {
  const { user } = useUser();

  if (!user || user.type !== type) {
    return <Navigate to="/" replace />;
  }

  return children;
}
