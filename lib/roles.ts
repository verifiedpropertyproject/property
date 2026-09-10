// Shared helpers for the two admin-tier roles. SUPER_ADMIN can do everything ADMIN can (every
// check in the app that gates on "is this user an admin" should use isAdminRole below), plus it
// alone can suspend, unsuspend, or delete other ADMIN accounts (see isSuperAdminRole and its
// use in app/api/admin/users/[id]/{suspend,route}.ts).
export const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"] as const;

export function isAdminRole(role: string | null | undefined): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export function isSuperAdminRole(role: string | null | undefined): boolean {
  return role === "SUPER_ADMIN";
}
