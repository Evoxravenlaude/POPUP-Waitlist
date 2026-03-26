# POPUP — Waitlist Site

Standalone early-access landing page for POPUP. Connects to the **same Supabase
project** as the main app so every wallet that joins the waitlist is instantly
available to the platform when it launches.

## How It Works

1. User lands on the page and connects their wallet (injected, MetaMask, Coinbase, or WalletConnect)
2. They click **Join Waitlist** — their wallet address is inserted into the shared `waitlist` table
3. When the main POPUP app launches, it queries the same table and can greet returning users,
   fast-track them through onboarding, or apply perks

## Setup

```bash
cp .env.example .env.local
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from your Supabase project
npm install
npm run dev
```

## Deploying to Vercel

1. Push this folder as its own repository (or a subdirectory with Vercel's monorepo support)
2. Set the two environment variables in Vercel → Project Settings → Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy — `vercel.json` already includes the SPA rewrite so direct URLs work

## Shared Supabase Setup

The `waitlist` table is created by the migration in the main app:
`POPUP-master/supabase/migrations/008_add_waitlist_table.sql`

If you're setting up Supabase fresh, run that migration first. The table schema is:

```sql
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Consuming Waitlist Data in the Main App

In `POPUP-master/src/lib/db.ts`, a `getWaitlistEntry(wallet)` function has been added.
Call it on wallet connect to check if the user was on the waitlist and personalise their
onboarding experience.
