import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var -- Permite 'var' para o singleton global em dev
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
