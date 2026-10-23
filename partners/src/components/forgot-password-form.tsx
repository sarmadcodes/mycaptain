"use client";

import Link from "next/link";
import { useState } from "react";

import { api, messageOf } from "@/lib/api";

import { Input } from "./register/fields";

export function ForgotPasswordForm() {
  const [step, setStep] = useState<"ask" | "reset" | "done">("ask");
  const [identifier, setIdentifier] = useState("");
  const [hint, setHint] = useState<string>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setError(undefined);
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : messageOf(e));
    } finally {
      setBusy(false);
    }
  };

  if (step === "done") {
    return (
      <div className="space-y-4 rounded-2xl border border-line p-6">
        <p className="font-semibold">Password changed</p>
        <p className="text-sm text-muted">Sign in with your new password. Other devices have been signed out.</p>
        <Link href="/sign-in" className="inline-flex h-11 items-center rounded-xl bg-blue px-5 text-sm font-semibold text-white hover:bg-blue-hover">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        if (step === "ask") {
          run(async () => {
            if (identifier.trim().length < 3) throw new Error("Enter your email or phone.");
            const r = await api<{ phoneHint?: string }>("/api/auth/forgot", { method: "POST", json: { identifier: identifier.trim() } });
            setHint(r.phoneHint);
            setStep("reset");
          });
        } else {
          run(async () => {
            await api("/api/auth/reset", {
              method: "POST",
              json: { identifier: identifier.trim(), code: String(data.get("code") ?? ""), password: String(data.get("password") ?? "") },
            });
            setStep("done");
          });
        }
      }}>
      {step === "ask" ? (
        <Input
          label="Email or phone"
          name="identifier"
          autoComplete="username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="you@company.pk or 3001234567"
        />
      ) : (
        <>
          <p className="text-sm text-muted">
            If an account matches, a 6-digit code was sent{hint ? ` to ${hint}` : ""}. It expires in 5 minutes.
          </p>
          <Input label="Code" name="code" inputMode="numeric" maxLength={6} autoComplete="one-time-code" />
          <Input label="New password" name="password" type="password" autoComplete="new-password" hint="At least 8 characters." />
        </>
      )}
      {error ? (
        <p role="alert" className="rounded-xl bg-pale px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={busy}
        className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-blue font-semibold text-white transition hover:bg-blue-hover disabled:opacity-60">
        {busy ? "Please wait..." : step === "ask" ? "Send code" : "Set new password"}
      </button>
    </form>
  );
}
