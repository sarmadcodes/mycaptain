import type { Metadata } from "next";
import Link from "next/link";

import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-sm space-y-8">
        <Link href="/" aria-label="Home">
          <Logo />
        </Link>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Reset password</h1>
          <p className="text-muted">We text a code to the mobile number on your partner account.</p>
        </div>
        <ForgotPasswordForm />
        <p className="text-sm text-muted">
          Remembered it?{" "}
          <Link href="/sign-in" className="font-semibold text-blue hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
