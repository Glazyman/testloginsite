"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CancelSubscriptionButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleCancel() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Cancellation failed");
      setDone(true);
      setConfirmed(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <p className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
        Your subscription will cancel at the end of the current billing period. You keep access until then.
      </p>
    );
  }

  if (confirmed) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Are you sure? You will keep access until the end of your current billing period.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors"
          >
            {loading ? "Cancelling…" : "Yes, cancel my subscription"}
          </button>
          <button
            onClick={() => setConfirmed(false)}
            disabled={loading}
            className="px-4 py-2 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 text-sm font-semibold rounded-lg hover:border-gray-400 transition-colors"
          >
            Keep subscription
          </button>
        </div>
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirmed(true)}
      className="text-sm text-red-500 hover:text-red-700 hover:underline transition-colors"
    >
      Cancel subscription
    </button>
  );
}
