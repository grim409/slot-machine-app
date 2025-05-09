import { NextAuthOptions } from "next-auth"
import EmailProvider, { SendVerificationRequestParams } from "next-auth/providers/email"
import { UpstashRedisAdapter } from "@next-auth/upstash-redis-adapter"
import { redis } from "./redis-client"
import nodemailer from "nodemailer"
import { google } from "googleapis"

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
)
oAuth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
})

async function sendMagicLink(params: SendVerificationRequestParams) {
  const { identifier: email, url, provider } = params

  const { token: accessToken } = await oAuth2Client.getAccessToken()
  if (!accessToken) throw new Error("Failed to fetch access token from Google")

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
  })

  const { host } = new URL(url)
  const subject = `Your magic link for Slots of Fun`
  const text    = `Click here to sign in to ${host}:\n\n${url}`
  const html    = `
    <p>Hey there,</p>
    <p><a href="${url}">Sign in to Slots of Fun</a></p>
    <p>If you didn’t request this, just ignore this email.</p>
  `

  await transporter.sendMail({
    from:    '"Slots of Fun No Reply" <slotsoffun@gstackintegrations.com>', 
    to:      email,
    subject,
    text,
    html,
  })
}

export const authOptions: NextAuthOptions = {
  adapter: UpstashRedisAdapter(redis),

  providers: [
    EmailProvider({
      server: {
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: process.env.EMAIL_ADDRESS!,
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          refreshToken: process.env.GOOGLE_REFRESH_TOKEN!,
        },
      },
      from: process.env.EMAIL_ADDRESS,
      sendVerificationRequest: sendMagicLink,
    }),
  ],

  session: { strategy: "jwt" },

  pages: {
    signIn:  "/auth/signin",
    newUser: "/auth/signup",
  },

  callbacks: {
    async session ({ session, token }) {
      if (session.user) session.user.id = token.sub!
      return session
    },
    async redirect ({ baseUrl }) {
      return baseUrl
    },
  },
}
