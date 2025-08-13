// src/types/next-auth.d.ts

import { UserRole } from "@prisma/client";
// Remova 'NextAuth' do import, pois não é usado
import { type DefaultSession, type DefaultUser } from "next-auth"; 
// Remova 'JWT' do import e adicione 'type' para ser mais explícito
import { type DefaultJWT } from "next-auth/jwt"; 

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: UserRole;
    id: string;
  }
}