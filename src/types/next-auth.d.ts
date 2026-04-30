import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: "user" | "admin";
      username: string;
    };
  }

  interface User {
    role: "user" | "admin";
    username: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "user" | "admin";
    username?: string;
  }
}
