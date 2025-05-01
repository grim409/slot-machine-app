import { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import { UpstashRedisAdapter } from "@next-auth/upstash-redis-adapter";
import { redis } from "./redis-client";

export const authOptions: NextAuthOptions = {
  adapter: UpstashRedisAdapter(redis),

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    EmailProvider({
      server: { host: "localhost", port: 587, auth: { user: "", pass: "" } },
      from: process.env.EMAIL_FROM,
      async sendVerificationRequest({ identifier, url }) {
        console.log(`\n📧 Magic link for ${identifier}: ${url}\n`);
      },
    }),
  ],

  session: { strategy: "jwt" },

  pages: {
    signIn: "/auth/signin",
    newUser: "/auth/signup",
  },

  callbacks: {
    async session({ session, token }) {
      if (session.user) session.user.id = token.sub!;
      return session;
    },

    async redirect({ baseUrl }) {
      return baseUrl;
    },
  },
};
