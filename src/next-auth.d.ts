/* eslint-disable @typescript-eslint/no-unused-vars */
import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";
import { UserRole } from "@prisma/client"; // Importe o Enum do Prisma

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

declare module "next-auth" {
  interface User {
    role?: UserRole;
    isActive?: boolean;
  }
  interface Session {
    user: {
      id: string;
      role: UserRole;
      isActive?: boolean;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    isActive?: boolean;
    name?: string | null;
    picture?: string | null;
  }
}
