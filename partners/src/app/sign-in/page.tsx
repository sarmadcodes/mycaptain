import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { Logo } from "@/components/logo";
import { SignInForm } from "@/components/sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <main className="grid min-h-[100dvh] lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-navy p-12 text-white lg:flex">
        <Link href="/" aria-label="Home">
          <Logo inverse />
        </Link>
        <div className="max-w-md space-y-4">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">Manage your team and bookings in one place.</h1>
          <p className="text-navy-text">Add drivers and guards, set availability, follow live duties and download payout statements.</p>
        </div>
        <p className="text-sm text-navy-text">Need help? partners@mycaptain.pk</p>
      </div>
      <div className="flex flex-col justify-center px-4 py-12 sm:px-6">
        <div className="mx-auto w-full max-w-sm space-y-8">
          <Link href="/" className="lg:hidden" aria-label="Home">
            <Logo />
          </Link>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Partner sign in</h2>
            <p className="text-muted">Use the email or phone number you registered with.</p>
          </div>
          <Suspense>
            <SignInForm />
          </Suspense>
          <p className="text-sm text-muted">
            Not a partner yet?{" "}
            <Link href="/register" className="font-semibold text-blue hover:underline">
              Apply now
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
