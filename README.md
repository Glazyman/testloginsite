# SubSite – Practice Subscription Website

A practice Next.js app with Supabase Auth, Stripe Checkout (subscriptions + one-time payments), and Vercel hosting.

---

## Project structure

```
.
├── app/
│   ├── layout.tsx                  # Root layout + global CSS
│   ├── globals.css                 # Tailwind CSS import
│   ├── page.tsx                    # Landing / home page
│   ├── signup/page.tsx             # Sign-up page
│   ├── login/page.tsx              # Log-in page
│   ├── forgot-password/page.tsx    # Request password reset email
│   ├── auth/
│   │   ├── reset-password/page.tsx # Set new password (after email link)
│   │   └── logout/route.ts         # POST route that signs the user out
│   ├── dashboard/page.tsx          # Protected dashboard (SSR)
│   ├── pricing/page.tsx            # Pricing cards + custom amount inputs
│   └── api/stripe/
│       ├── checkout/route.ts       # Creates Stripe Checkout Sessions
│       └── webhook/route.ts        # Receives + processes Stripe events
├── components/
│   └── AuthForm.tsx                # Reusable auth form component
├── lib/
│   ├── stripe.ts                   # Stripe SDK singleton (server-only)
│   └── supabase/
│       ├── browser.ts              # Supabase browser client
│       └── server.ts               # Supabase server + service-role clients
├── middleware.ts                   # Session refresh + /dashboard protection
├── supabase/
│   └── schema.sql                  # Full database schema (run in SQL editor)
├── .env.local.example              # Copy to .env.local and fill in values
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
└── package.json
```

---

## Step-by-step setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.local.example` to `.env.local` and fill in each value (see sections below):

```bash
cp .env.local.example .env.local
```

---

### 3. Set up Supabase

#### A. Create a project
1. Go to [supabase.com](https://supabase.com) and click **New project**.
2. Note your **Project URL** and **anon key** (Settings → API).
3. Note your **service_role key** (Settings → API → secret).

#### B. Enable email/password auth
1. Go to **Authentication → Providers**.
2. Ensure **Email** is enabled (it is by default).
3. Under **Authentication → URL Configuration**, add these to **Redirect URLs**:
   - `http://localhost:3000/**`
   - `https://your-app.vercel.app/**` (add after you know your Vercel URL)

#### C. Run the database schema
1. Go to **SQL Editor** in your Supabase project.
2. Open `supabase/schema.sql` in this repository.
3. Paste the entire file and click **Run**.

This creates:
- `profiles` table (auto-populated on sign-up via trigger)
- `subscriptions` table (populated by Stripe webhook)
- `payments` table (populated by Stripe webhook)
- Row Level Security policies so users only see their own data

#### D. Fill in Supabase env vars
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

### 4. Set up Stripe

#### A. Create a Stripe account
Go to [stripe.com](https://stripe.com) and sign up (or log in).
Make sure you are in **Test mode** (toggle in the top-right of the dashboard).

#### B. Get your API keys
Go to **Developers → API keys**:
```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

#### C. Create the two fixed-price products

**Product 1 – Monthly Plan ($1/mo)**
1. Go to **Product catalog → + Add product**.
2. Name: `Monthly Plan`
3. Pricing: **Recurring**, $1.00 USD, Every month.
4. Click **Save product**.
5. Copy the **Price ID** that starts with `price_...`
6. Set: `STRIPE_PRICE_MONTHLY_ID=price_...`

**Product 2 – One-Time Plan ($1)**
1. Click **+ Add product**.
2. Name: `One-Time Plan`
3. Pricing: **One time**, $1.00 USD.
4. Click **Save product**.
5. Copy the **Price ID**.
6. Set: `STRIPE_PRICE_ONE_TIME_ID=price_...`

> Custom-amount plans (plans 3 and 4) don't need Stripe products — amounts are created server-side dynamically.

#### D. Set up the Stripe webhook

**For local development:**

1. Install the [Stripe CLI](https://docs.stripe.com/stripe-cli).
2. Log in:
   ```bash
   stripe login
   ```
3. Forward events to your local dev server:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. The CLI will print a webhook signing secret like `whsec_...`. Copy it:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
5. Keep this terminal running while you test.

**For production (Vercel):**

1. Go to **Developers → Webhooks → + Add endpoint** in the Stripe dashboard.
2. Endpoint URL: `https://your-app.vercel.app/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
4. Click **Add endpoint**.
5. Click **Reveal** to get the signing secret and add it to Vercel env vars.

---

### 5. Finish filling in env vars

Your complete `.env.local` should look like:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

STRIPE_SECRET_KEY=sk_test_51...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...

STRIPE_PRICE_MONTHLY_ID=price_...
STRIPE_PRICE_ONE_TIME_ID=price_...

NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

### 6. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**To test payments, use Stripe test cards:**

| Card number          | Scenario          |
|----------------------|-------------------|
| `4242 4242 4242 4242`| Always succeeds   |
| `4000 0000 0000 9995`| Always declines   |

Use any future expiry date and any 3-digit CVC.

---

### 7. Deploy to Vercel

#### A. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
gh repo create my-sub-site --public --push --source=.
```

#### B. Import into Vercel
1. Go to [vercel.com/new](https://vercel.com/new).
2. Import your GitHub repository.
3. Vercel will detect Next.js automatically — no build config needed.

#### C. Add environment variables in Vercel
Go to your Vercel project → **Settings → Environment Variables** and add all the same variables from your `.env.local`, but update:
```
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
```
Also update the Stripe production webhook secret with the value from the Stripe dashboard webhook endpoint.

#### D. Redeploy
After adding env vars, click **Redeploy** to pick up the new values.

#### E. Update Supabase redirect URLs
Go back to **Authentication → URL Configuration** in Supabase and add your Vercel URL:
```
https://your-app.vercel.app/**
```

---

## How the payment flow works

```
User clicks plan → POST /api/stripe/checkout
  → verifies Supabase session (server-side)
  → creates/retrieves Stripe customer, stores stripe_customer_id in profiles
  → creates Stripe Checkout Session
  → returns { url } → browser redirects to Stripe hosted checkout

User pays → Stripe redirects to /dashboard?success=1
  → Stripe also fires a webhook to /api/stripe/webhook

Webhook handler:
  → verifies stripe-signature header
  → checkout.session.completed
      subscription → upserts into subscriptions table
      payment      → inserts into payments table
  → customer.subscription.updated/deleted → updates subscriptions table
  → invoice.paid → refreshes current_period_end

Dashboard (server-rendered):
  → reads subscriptions + payments for the logged-in user under RLS
  → displays current plan, status, renewal date, payment history
```

---

## Security notes

- `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `STRIPE_WEBHOOK_SECRET` are **never exposed to the browser** — they live only in server-side code and env vars without the `NEXT_PUBLIC_` prefix.
- Stripe webhook signature is verified on every request before any database writes happen.
- Supabase RLS ensures users can only read their own `profiles`, `subscriptions`, and `payments` rows.
- The `/dashboard` route is protected both by `middleware.ts` (redirect before render) and server-side `getUser()` check inside the page.
- The service-role client used in the webhook bypasses RLS intentionally — it is only used server-side in the webhook route handler.
