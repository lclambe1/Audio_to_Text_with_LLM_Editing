# Setup Guide

## 1. Install dependencies
```bash
cd web-app
npm install
```

## 2. Configure environment
```bash
cp .env.local.example .env.local
# Fill in all values in .env.local
```

## 3. Supabase
1. Create a project at https://supabase.com
2. Copy URL + anon key into `.env.local`
3. Go to SQL Editor → paste and run `supabase/migrations/001_initial.sql`

## 4. OpenAI
1. Get API key from https://platform.openai.com/api-keys
2. Add to `.env.local` as `OPENAI_API_KEY`

## 5. Stripe
1. Create account at https://stripe.com
2. Add publishable + secret keys to `.env.local`
3. Create a Product → Recurring price → copy price ID to `STRIPE_PRICE_ID_PRO`
4. For webhooks in dev: `npx stripe listen --forward-to localhost:3000/api/webhooks/stripe`

## 6. Run locally
```bash
npm run dev
# Open http://localhost:3000
```

## 7. Deploy to Vercel
```bash
npx vercel
# Set all env vars in Vercel dashboard → Settings → Environment Variables
# Update NEXT_PUBLIC_APP_URL to your Vercel URL
```

## 8. iOS (Capacitor) — after Vercel deploy
```bash
npm install
npx cap add ios
# Update capacitor.config.ts with your Vercel URL
npm run cap:sync
npm run cap:ios   # Opens Xcode — run on simulator or device
```
