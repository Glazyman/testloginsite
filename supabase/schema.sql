-- ============================================================
-- SubSite – Supabase Schema
-- Run this in your Supabase project's SQL Editor.
-- ============================================================

-- ─── profiles ───────────────────────────────────────────────
-- One row per auth.users row, created automatically by the trigger below.

create table if not exists public.profiles (
  id                  uuid primary key references auth.users (id) on delete cascade,
  email               text,
  stripe_customer_id  text unique,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users can read and update only their own profile.
create policy "profiles: select own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id);

-- ─── subscriptions ──────────────────────────────────────────
-- Populated/updated by the Stripe webhook.

create table if not exists public.subscriptions (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid not null references auth.users (id) on delete cascade,
  stripe_subscription_id    text unique not null,
  stripe_customer_id        text,
  price_id                  text,
  status                    text not null default 'incomplete',
  current_period_end        timestamptz,
  cancel_at_period_end      boolean not null default false,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "subscriptions: select own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- ─── payments ───────────────────────────────────────────────
-- One-time payment records.

create table if not exists public.payments (
  id                            uuid primary key default gen_random_uuid(),
  user_id                       uuid not null references auth.users (id) on delete cascade,
  stripe_payment_intent_id      text unique,
  stripe_checkout_session_id    text unique,
  amount_cents                  int not null,
  currency                      text not null default 'usd',
  status                        text not null default 'pending',
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now()
);

alter table public.payments enable row level security;

create policy "payments: select own"
  on public.payments for select
  using (auth.uid() = user_id);

-- ─── trigger: auto-create profile on signup ─────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Drop and re-create so re-runs are idempotent
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── helper: updated_at auto-stamp ──────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at    on public.profiles;
drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
drop trigger if exists set_payments_updated_at    on public.payments;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

create trigger set_payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();
