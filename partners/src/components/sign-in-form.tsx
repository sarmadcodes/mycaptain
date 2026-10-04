"use client";

import { useState } from "react";

import { Input } from "./register/fields";

// TODO(backend): POST /partners/auth/login, then route to the partner dashboard.
export function SignInForm() {
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        if (!data.get("email") || !data.get("password")) return setError("Enter your email and password.");
        setError(undefined);
        setLoading(true);
        await new Promise((r) => setTimeout(r, 900));
        setLoading(false);
        setError("The partner dashboard opens once your application is approved.");
      }}>
      <Input label="Email" name="email" type="email" autoComplete="email" />
      <Input label="Password" name="password" type="password" autoComplete="current-password" />
      {error ? (
        <p role="alert" className="rounded-xl bg-pale px-4 py-3 text-sm text-ink">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-blue font-semibold text-white transition hover:bg-blue-hover active:scale-[0.98] disabled:opacity-60">
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
