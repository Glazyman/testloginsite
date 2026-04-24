import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex flex-col min-h-screen bg-white dark:bg-slate-900">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
        <span className="text-xl font-bold text-indigo-600">SubSite</span>
        <div className="flex items-center gap-3">
          <Link
            href="/pricing"
            className="text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 transition-colors"
          >
            Pricing
          </Link>
          {user ? (
            <Link
              href="/dashboard"
              className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        <span className="inline-block mb-4 text-xs font-semibold tracking-widest text-indigo-500 uppercase bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full">
          Practice Project
        </span>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6 max-w-3xl">
          A simple subscription app to practice{" "}
          <span className="text-indigo-600">real payments</span>
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mb-10 max-w-xl">
          Built with Next.js, Supabase, and Stripe. Sign up, pick a plan, and
          see how subscriptions and one-time payments work end-to-end.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {user ? (
            <Link
              href="/dashboard"
              className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors text-base"
            >
              Go to Dashboard
            </Link>
          ) : (
            <Link
              href="/signup"
              className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors text-base"
            >
              Get Started Free
            </Link>
          )}
          <Link
            href="/pricing"
            className="px-8 py-3 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 font-semibold rounded-xl hover:border-indigo-400 hover:text-indigo-600 transition-colors text-base"
          >
            View Pricing
          </Link>
          {!user && (
            <Link
              href="/login"
              className="px-8 py-3 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 font-semibold rounded-xl hover:border-indigo-400 hover:text-indigo-600 transition-colors text-base"
            >
              Log In
            </Link>
          )}
        </div>
      </section>

      {/* Feature grid */}
      <section className="px-6 py-16 bg-gray-50 dark:bg-slate-800/50">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-6">
          {[
            {
              title: "Supabase Auth",
              desc: "Email/password login with persistent sessions via cookies. Stays logged in after refresh.",
            },
            {
              title: "Stripe Checkout",
              desc: "Fixed or custom dollar amounts. Monthly subscriptions or one-time payments via hosted checkout.",
            },
            {
              title: "Secure & Simple",
              desc: "Server-side route handlers, RLS policies, and webhook verification. Secret keys never hit the browser.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {f.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center py-6 text-sm text-gray-400 dark:text-gray-600">
        SubSite &mdash; practice project only. All payments use Stripe test mode.
      </footer>
    </main>
  );
}
