import "next-auth";
import "next-auth/jwt";

// SUPER_ADMIN has every ADMIN capability plus the ability to manage other admin accounts
// (suspend/unsuspend, delete, promote/demote) — see lib/roles.ts for the shared helpers that
// treat ADMIN and SUPER_ADMIN as "admin" throughout the app.
export type Role = "ADMIN" | "SUPER_ADMIN" | "BUYER" | "OWNER" | "AGENT";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role | null;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role | null;
  }
}
