"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type PlanType = "monthly" | "onetime" | "custom-monthly" | "custom-onetime";

async function startCheckout(planType: PlanType, amount?: number) {
  const res = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planType, amount }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Checkout failed");
  if (data.url) window.location.href = data.url;
}

function PlanCard({
  title,
  price,
  description,
  badge,
  children,
}: {
  title: string;
  price: string;
  description: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-8 flex flex-col gap-4">
      {badge && (
        <span className="inline-block text-xs font-semibold tracking-widest text-indigo-500 uppercase bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full w-fit">
          {badge}
        </span>
      )}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {title}
        </h2>
        <p className="text-3xl font-extrabold text-indigo-600 mt-1">{price}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          {description}
        </p>
      </div>
      <div className="mt-auto pt-2">{children}</div>
    </div>
  );
}

function CheckoutButton({
  planType,
  label,
  amount,
}: {
  planType: PlanType;
  label: string;
  amount?: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle() {
    setLoading(true);
    setError(null);
    try {
      await startCheckout(planType, amount);
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        err.message.toLowerCase().includes("not authenticated")
      ) {
        router.push("/login?redirectTo=/pricing");
        return;
      }
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handle}
        disabled={loading}
        className="w-full py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Redirecting…" : label}
      </button>
      {error && (
        <p className="text-xs text-red-500 text-center">{error}</p>
      )}
    </div>
  );
}

function CustomPlanCard({
  title,
  description,
  badge,
  planType,
  buttonLabel,
}: {
  title: string;
  description: string;
  badge?: string;
  planType: "custom-monthly" | "custom-onetime";
  buttonLabel: string;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = parseFloat(amount);
  const valid = !isNaN(parsed) && parsed >= 1;

  async function handle() {
    if (!valid) return;
    setLoading(true);
    setError(null);
    try {
      await startCheckout(planType, parsed);
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        err.message.toLowerCase().includes("not authenticated")
      ) {
        router.push("/login?redirectTo=/pricing");
        return;
      }
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-8 flex flex-col gap-4">
      {badge && (
        <span className="inline-block text-xs font-semibold tracking-widest text-indigo-500 uppercase bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full w-fit">
          {badge}
        </span>
      )}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {title}
        </h2>
        <p className="text-3xl font-extrabold text-indigo-600 mt-1">
          ${amount || "?"}
          {planType === "custom-monthly" && (
            <span className="text-base font-normal text-gray-400"> /mo</span>
          )}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          {description}
        </p>
      </div>
      <div className="mt-auto pt-2 space-y-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
            $
          </span>
          <input
            type="number"
            min={1}
            step={0.01}
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full pl-7 pr-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>
        <button
          onClick={handle}
          disabled={loading || !valid}
          className="w-full py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Redirecting…" : buttonLabel}
        </button>
        {!valid && amount !== "" && (
          <p className="text-xs text-amber-500 text-center">
            Amount must be at least $1
          </p>
        )}
        {error && (
          <p className="text-xs text-red-500 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <Link
          href="/"
          className="text-xl font-bold text-indigo-600"
        >
          SubSite
        </Link>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-3">
            Choose a plan
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
            All payments use Stripe test mode — use card{" "}
            <code className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm font-mono">
              4242 4242 4242 4242
            </code>{" "}
            with any future expiry and any CVC.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Plan 1 – Monthly */}
          <PlanCard
            title="Monthly Plan"
            price="$1/mo"
            description="Recurring monthly subscription. Cancel anytime."
            badge="Subscription"
          >
            <CheckoutButton planType="monthly" label="Subscribe Monthly" />
          </PlanCard>

          {/* Plan 2 – One Time */}
          <PlanCard
            title="One-Time Plan"
            price="$1"
            description="Single payment, no recurring charges."
            badge="One-Time"
          >
            <CheckoutButton planType="onetime" label="Pay Once" />
          </PlanCard>

          {/* Plan 3 – Custom Monthly */}
          <CustomPlanCard
            title="Custom Monthly"
            description="Choose your own amount — billed monthly."
            badge="Custom"
            planType="custom-monthly"
            buttonLabel="Subscribe Monthly"
          />

          {/* Plan 4 – Custom One-Time */}
          <CustomPlanCard
            title="Custom One-Time"
            description="Pay any amount, just once."
            badge="Custom"
            planType="custom-onetime"
            buttonLabel="Pay One Time"
          />
        </div>

        <p className="text-center text-sm text-gray-400 dark:text-gray-600 mt-10">
          You must be{" "}
          <Link href="/login" className="text-indigo-500 hover:underline">
            logged in
          </Link>{" "}
          to check out.
        </p>
      </div>
    </main>
  );
}
