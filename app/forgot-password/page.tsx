"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";
import AuthForm from "@/components/AuthForm";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleReset(values: Record<string, string>) {
    setError(null);
    setSuccess(null);
    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
    });

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess(
      "Password reset email sent. Check your inbox and follow the link."
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold text-indigo-600">
            SubSite
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            Reset your password
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Remember it?{" "}
            <Link
              href="/login"
              className="text-indigo-600 hover:underline font-medium"
            >
              Log in
            </Link>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <AuthForm
            fields={[
              {
                id: "email",
                label: "Email address",
                type: "email",
                placeholder: "you@example.com",
                autoComplete: "email",
              },
            ]}
            submitLabel="Send Reset Link"
            onSubmit={handleReset}
            error={error}
            success={success}
          />
        </div>
      </div>
    </main>
  );
}
