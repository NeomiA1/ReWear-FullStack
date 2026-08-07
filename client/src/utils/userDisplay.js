// Normalizes the logged-in user's display name across account types.
// Real user objects only ever carry one of these name fields depending on
// account type (private → fullName, org → orgName, shop → shopName/fullName);
// this picks whichever is actually present instead of assuming one.
export function getUserDisplayName(user) {
  const name = user?.fullName || user?.orgName || user?.shopName || user?.email;
  if (!name) {
    if (import.meta.env.DEV) {
      console.warn("getUserDisplayName: no name field found on user object", user);
    }
    return "משתמש";
  }
  return name;
}

export function getUserInitial(user) {
  return getUserDisplayName(user).charAt(0);
}
