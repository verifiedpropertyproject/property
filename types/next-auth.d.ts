import "next-auth";
import "next-auth/jwt";

export type Role = "ADMIN" | "BUYER" | "OWNER" | "AGENT";

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
