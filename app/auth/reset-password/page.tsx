"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import AuthForm from "@/components/AuthForm";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleUpdate(values: Record<string, string>) {
    setError(null);
    setSuccess(null);

    if (values.password !== values.confirm) {
      setError("Passwords do not match.");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: values.password,
    });

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess("Password updated! Redirecting to dashboard…");
    setTimeout(() => router.push("/dashboard"), 2000);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold text-indigo-600">
            SubSite
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            Set a new password
          </h1>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <AuthForm
            fields={[
              {
                id: "password",
                label: "New password",
                type: "password",
                placeholder: "Minimum 6 characters",
                autoComplete: "new-password",
              },
              {
                id: "confirm",
                label: "Confirm password",
                type: "password",
                placeholder: "Repeat your new password",
                autoComplete: "new-password",
              },
            ]}
            submitLabel="Update Password"
            onSubmit={handleUpdate}
            error={error}
            success={success}
          />
        </div>
      </div>
    </main>
  );
}
