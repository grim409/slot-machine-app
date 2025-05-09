import { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
// import GoogleProvider from "next-auth/providers/google";  // temporarily removed
import { UpstashRedisAdapter } from "@next-auth/upstash-redis-adapter";
import { redis } from "./redis-client";
import nodemailer from "nodemailer";
import { google } from "googleapis";

const OAuth2 = google.auth.OAuth2;

/**
 * Sends the NextAuth magic link via Gmail SMTP using OAuth2.
 */
async function sendMagicLink({
  identifier: email,
  url,
}: {
  identifier: string;
  url: string;
}) {
  // 1) Create an OAuth2 client with your env credentials
  const oauth2Client = new OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground" // this can be any valid redirect
  );
  oauth2Client.setCredentials({
    // your refresh token from env
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  // 2) Retrieve a fresh access token
  const { token: accessToken } = await oauth2Client.getAccessToken();
  if (!accessToken) {
    throw new Error("Failed to fetch Gmail access token");
  }

  // 3) Configure Nodemailer to use Gmail and OAuth2
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.EMAIL_ADDRESS,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      accessToken,
    },
  });

  // 4) Send the actual magic link email
  await transporter.sendMail({
    from: process.env.EMAIL_ADDRESS,
    to: email,
    subject: "Your magic link for Slots of Fun",
    text: `Sign in to Slots of Fun: ${url}`,
    html: `<p>Click <a href="${url}">this link</a> to sign in to Slots of Fun.</p>`,
  });
}

export const authOptions: NextAuthOptions = {
  adapter: UpstashRedisAdapter(redis),

  providers: [
    EmailProvider({
      // nodemailer transport options
      server: {
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: process.env.EMAIL_ADDRESS,
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        },
      },
      from: process.env.EMAIL_ADDRESS,
      sendVerificationRequest: sendMagicLink,
    }),
    // GoogleProvider is still configured below but hidden in the UI until you're ready
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    // }),
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