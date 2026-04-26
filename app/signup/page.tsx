"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import AuthForm from "@/components/AuthForm";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSignUp(values: Record<string, string>) {
    setError(null);
    setSuccess(null);
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/login`,
      },
    });

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess(
      "Check your email to confirm your account, then log in."
    );
    setTimeout(() => router.push("/login"), 3500);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="text-2xl font-bold text-indigo-600"
          >
            SubSite
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            Create an account
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Already have one?{" "}
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
                label: "Email",
                type: "email",
                placeholder: "you@example.com",
                autoComplete: "email",
              },
              {
                id: "password",
                label: "Password",
                type: "password",
                placeholder: "Minimum 6 characters",
                autoComplete: "new-password",
              },
            ]}
            submitLabel="Create Account"
            onSubmit={handleSignUp}
            error={error}
            success={success}
          />
        </div>
      </div>
    </main>
  );
}
