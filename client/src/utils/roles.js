// ערכי user.type האמיתיים היחידים בשימוש בכל הקוד (ראו LoginPage.jsx:deriveType,
// RegisterPrivatePage/RegisterOrgPage/RegisterShopPage) — אין ערכים חריגים
// כמו "user"/"association"/"store", אז אין צורך בנרמול נוסף כאן.
export const ROLES = ["private", "org", "shop"];

export function homeRouteForRole(role) {
  switch (role) {
    case "org":  return "/org/home";
    case "shop": return "/shop/home";
    case "private":
    default:     return "/home";
  }
}
