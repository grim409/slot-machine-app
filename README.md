# 🎰 Slots of Fun

A modern, fully-client slot-machine game built with **Next.js**, **React**, **Tailwind CSS** + **DaisyUI**, **NextAuth**, and **Upstash Redis**.  
Authentication via Google & email magic-link, backed by Redis. Real-time spins, paylines, confetti, and a “Buy Coins” stub.

---

## 🚀 Features

- **Auth**: NextAuth w/ Google and EmailProvider using magic links  
- **User store**: Upstash Redis adapter for sessions + user data  
- **Title Screen**: Animated gradient, pulsing title, “Play Now” link to `/auth/signin`  
- **Custom Sign-In/Sign-Up** pages with Tailwind + DaisyUI styling  
- **API**:
  - `GET /api/coins` → daily reset to 10 coins  
  - `POST /api/coins?bet=X` → deducts X, spins 5 reels, payouts, save balance  
- **Slot Machine** (`5×3` grid):
  - CSS keyframe spin animation  
  - Big “🎰 SPIN 🎰” button  
  - **Bet One & Spin**, **Max Bet & Spin**, **Reset Bet**, **Increment Bet** controls  
  - Balance & current bet display  
  - Payline detection (horizontal + two diagonals), cells highlighted on win  
  - Full-screen confetti (via `react-confetti`), intensity/duration scaled by win  
  - DaisyUI alert banner (won’t shift layout)  
  - “Buy Coins” stub modal (+10 / +25 / +50 coins)

---

## 🛠 Tech Stack

- **Next.js 13 (App Router)**  
- **React + TypeScript**  
- **Tailwind CSS** & **DaisyUI**  
- **NextAuth.js** w/ `@next-auth/upstash-redis-adapter`  
- **Upstash Redis** (REST API)  
- **react-confetti**  
- **Vercel** deployment  

---

## 🔧 Getting Started

### Prerequisites

- Node.js ≥16  
- NPM or Yarn  
- Upstash Redis URL & token  
- (Optional) SMTP credentials for email magic links

### Installation

```bash
git clone <your-repo-url>
cd slot-machine-app
npm install
```

### Environment Variables

Create a `.env.local`:

```env
UPSTASH_REDIS_REST_URL=https://<your-upstash-host>.upstash.io
UPSTASH_REDIS_REST_TOKEN=<your-upstash-token>
NEXTAUTH_SECRET=<random-base64-string>
GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
EMAIL_FROM="Slots of Fun <no-reply@yourdomain.com>"
# For production SMTP, set EMAIL_SERVER_*
```

### Run Locally

```bash
npm run dev
# http://localhost:3000
```

### Build & Deploy

```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
public/
└── win.mp3
src/
└── app/
    └── api/
        ├── auth/[...nextauth]/route.ts
        └── coins/route.ts
    ├── auth/
    │   ├── signin/page.tsx
    │   └── signup/page.tsx
    ├── layout.tsx
    ├── page.tsx
    └── providers.tsx
  components/
    ├── TitleScreen.tsx
    └── SlotMachine.tsx
  lib/
    ├── auth.ts
    └── redis-client.ts
  types/next-auth.d.ts
globals.css
next.config.js
tsconfig.json
package.json
```

---
