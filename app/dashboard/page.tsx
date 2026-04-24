import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import CancelSubscriptionButton from "@/components/CancelSubscriptionButton";

function StatusBadge({ status, cancelAtPeriodEnd }: { status: string; cancelAtPeriodEnd?: boolean }) {
  const colors: Record<string, string> = {
    active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    trialing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    past_due: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    canceled: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    incomplete: "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400",
    succeeded: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  };
  const cls = colors[status] ?? "bg-gray-100 text-gray-600";
  return (
    <div className="flex flex-col items-end gap-1">
      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
        {status}
      </span>
      {cancelAtPeriodEnd && (
        <span className="text-xs text-orange-500">cancels at period end</span>
      )}
    </div>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatAmount(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export default async function DashboardPage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard");
  }

  // Fetch subscriptions (most recent first)
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("id, stripe_subscription_id, price_id, status, current_period_end, cancel_at_period_end, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch one-time payments (most recent first)
  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const activeSubscription = subscriptions?.find(
    (s) => s.status === "active" || s.status === "trialing"
  );

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <Link href="/" className="text-xl font-bold text-indigo-600">
          SubSite
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/pricing"
            className="text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 transition-colors"
          >
            Pricing
          </Link>
          <form action="/auth/logout" method="POST">
            <button
              type="submit"
              className="text-sm bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
            >
              Log Out
            </button>
          </form>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        {/* Welcome card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Logged in as{" "}
            <span className="font-medium text-gray-700 dark:text-gray-200">
              {user.email}
            </span>
          </p>
        </div>

        {/* Current plan summary */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Current Plan
          </h2>
          {activeSubscription ? (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Status</span>
                <StatusBadge
                  status={activeSubscription.status}
                  cancelAtPeriodEnd={activeSubscription.cancel_at_period_end}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Price ID</span>
                <span className="font-mono text-xs text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-slate-700 px-2 py-0.5 rounded">
                  {activeSubscription.price_id ?? "custom"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  Renews / expires
                </span>
                <span className="text-gray-700 dark:text-gray-200">
                  {formatDate(activeSubscription.current_period_end)}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-400 dark:text-gray-500 mb-4">
                You don&apos;t have an active subscription.
              </p>
              <Link
                href="/pricing"
                className="inline-block px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
              >
                View Plans
              </Link>
            </div>
          )}

          {/* Cancel button — only shown when subscription is active */}
          {activeSubscription &&
            activeSubscription.status !== "canceled" && (
              <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
                <CancelSubscriptionButton />
              </div>
            )}
        </div>

        {/* All subscriptions */}
        {subscriptions && subscriptions.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Subscription History
            </h2>
            <div className="space-y-3">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between text-sm border-b border-gray-50 dark:border-slate-700 pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-200">
                      {sub.price_id ?? "Custom monthly"}
                    </p>
                    <p className="text-xs text-gray-400">
                      Started {formatDate(sub.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={sub.status} cancelAtPeriodEnd={sub.cancel_at_period_end} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* One-time payments */}
        {payments && payments.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              One-Time Payments
            </h2>
            <div className="space-y-3">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between text-sm border-b border-gray-50 dark:border-slate-700 pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-200">
                      {formatAmount(p.amount_cents, p.currency)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDate(p.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No activity at all */}
        {(!subscriptions || subscriptions.length === 0) &&
          (!payments || payments.length === 0) && (
            <div className="text-center py-4 text-sm text-gray-400">
              No payment history yet.{" "}
              <Link href="/pricing" className="text-indigo-500 hover:underline">
                Choose a plan
              </Link>{" "}
              to get started.
            </div>
          )}
      </div>
    </main>
  );
}
