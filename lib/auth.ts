import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { randomToken } from "@/lib/utils";

/** A private forwarding address such as alerts-k3x9p2@in.yourapp.com. */
export function newAlertAddress() {
  return `alerts-${randomToken(8)}@${env.inboundDomain}`;
}

export const auth = betterAuth({
  baseURL: env.appUrl,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, { provider: "postgresql" }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      // gmail.send is requested only when the user connects Gmail for sending.
      accessType: "offline",
      prompt: "select_account consent",
    },
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID ?? "",
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET ?? "",
    },
  },
  account: {
    // OAuth tokens are encrypted at rest.
    encryptOAuthTokens: true,
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "linkedin"],
      allowDifferentEmails: true,
    },
  },
  user: {
    additionalFields: {
      alertAddress: { type: "string", required: false, input: false },
    },
    deleteUser: { enabled: true },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => ({ data: { ...user, alertAddress: newAlertAddress() } }),
      },
    },
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
