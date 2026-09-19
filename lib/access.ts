import { navigation } from "./navigation";
export const fpoPermission: Record<string, string> = {
  farmers: "verify",
  lots: "manage",
  quality: "verify",
  circles: "manage",
  collection: "collect",
  warehouse: "warehouse",
  inventory: "warehouse",
  transactions: "accounts",
  reports: "accounts",
};
export function sectionAllowed(
  user: { role: string; permissions: string[] },
  section: string,
) {
  return (
    !!navigation[user.role]?.some((x) => x[0] === section) &&
    (user.role !== "fpo" ||
      !fpoPermission[section] ||
      user.permissions.includes(fpoPermission[section]))
  );
}
