import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const base = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = base;

// Middleware: auto-generate id for all create/createMany operations
base.$use(async (params, next) => {
  if (params.action === "create" && params.args.data) {
    if (!params.args.data.id) {
      params.args.data.id = crypto.randomUUID();
    }
  }
  if (params.action === "createMany" && Array.isArray(params.args.data)) {
    for (const item of params.args.data) {
      if (!item.id) {
        item.id = crypto.randomUUID();
      }
    }
  }
  return next(params);
});

export const prisma = base;

export const getPrisma = (): PrismaClient => prisma;