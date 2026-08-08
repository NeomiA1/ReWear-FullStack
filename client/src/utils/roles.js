
export const ROLES = ["private", "org", "shop"];

export function homeRouteForRole(role) {
  switch (role) {
    case "org":  return "/org/home";
    case "shop": return "/shop/home";
    case "private":
    default:     return "/home";
  }
}
