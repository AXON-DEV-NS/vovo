# VOVO Agent AI

Autonomous AI-powered YouTube channel manager. Research, script drafting, compliance checks, asset generation, and scheduled publishing — creators stay in control with 1-click review.

## Features

- **Multi-Stage AI Pipeline**: Connect channel → Niche research & search intelligence → DeepSeek script drafting & compliance review → Media asset synthesis → Scheduled YouTube publishing.
- **Creator Dashboard**: Live metrics, content calendar, script review with feedback loop (Mistake Log), channel analytics, and support tickets.
- **Admin Control Gateway (`/vovo-hq-secure-gateway`)**:
  - Secure owner access gated by TOTP 2FA, scrypt password hashing, and brute-force lockouts.
  - Plan pricing overrides, dynamic promo code generation, free access grants, and guardian security monitoring.
  - Direct persistence into Neon PostgreSQL (`prisma/schema.prisma`).
- **Security & Hygiene**:
  - Edge middleware route isolation.
  - Strict Content-Security-Policy (CSP), Cross-Origin-Opener-Policy (COOP), HSTS, and X-Frame-Options.
  - Serverless-persistent rate limiting via Upstash Redis and PostgreSQL security events.
  - Channel ownership enforcement on all multi-tenant routes to prevent IDOR.

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org) (App Router, React 19)
- **Database & ORM**: PostgreSQL (Neon) with [Prisma ORM 5](https://www.prisma.io)
- **Styling**: Tailwind CSS with custom editorial design system (Fraunces & Inter)
- **AI Engines**: DeepSeek (reasoning & scripting), Tavily/Serper (search intelligence), Higgsfield/ElevenLabs (media synthesis)
- **Rate Limiting**: Upstash Redis with PostgreSQL fallback
- **Authentication**: JWT session cookies with timing-safe verification, YouTube OAuth 2.0 with AES-256-GCM encrypted tokens

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Copy `.env.example` to `.env.local` and populate required keys:
   ```bash
   cp .env.example .env.local
   ```

3. **Initialize Database**:
   ```bash
   npx prisma db push
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

## Admin Setup

To initialize or update the admin credentials and TOTP secret:
```bash
node scripts/setup-admin.mjs "<your-secure-password>"
```
Copy the generated values into `.env.local` and import the TOTP secret into your authenticator app.
