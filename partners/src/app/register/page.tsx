import type { Metadata } from "next";

import { RegisterForm } from "@/components/register/register-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Apply",
  description: "Register your driver or security company as a My Captain partner.",
};

export default function RegisterPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6 md:py-16">
        <div className="mb-10 max-w-2xl space-y-3 md:mb-14">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Partner application</h1>
          <p className="text-muted">For registered driver agencies and licensed security companies. It takes about ten minutes.</p>
        </div>
        <RegisterForm />
      </main>
      <SiteFooter />
    </>
  );
}
