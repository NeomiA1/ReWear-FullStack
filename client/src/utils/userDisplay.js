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
