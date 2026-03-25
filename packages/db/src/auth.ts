import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { getPrismaClient } from "./client";

type BetterAuthInstance = ReturnType<typeof createBetterAuthInstance>;

const globalForBetterAuth = globalThis as typeof globalThis & {
  boatAdminAuth?: BetterAuthInstance;
};

function requireEnvironmentValue(name: "BETTER_AUTH_SECRET" | "BETTER_AUTH_URL"): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required to use admin authentication.`);
  }

  return value;
}

function createBetterAuthInstance() {
  const prisma = getPrismaClient();

  if (!prisma) {
    throw new Error("DATABASE_URL is required to use admin authentication.");
  }

  return betterAuth({
    secret: requireEnvironmentValue("BETTER_AUTH_SECRET"),
    baseURL: requireEnvironmentValue("BETTER_AUTH_URL"),
    database: prismaAdapter(prisma, {
      provider: "postgresql",
      transaction: true
    }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true
    },
    account: {
      accountLinking: {
        enabled: false
      }
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          required: false,
          defaultValue: "admin",
          input: false
        }
      }
    }
  });
}

export function getAuth() {
  if (!globalForBetterAuth.boatAdminAuth) {
    globalForBetterAuth.boatAdminAuth = createBetterAuthInstance();
  }

  return globalForBetterAuth.boatAdminAuth;
}
