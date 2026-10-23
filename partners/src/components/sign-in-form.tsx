"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { api, messageOf } from "@/lib/api";

import { Input } from "./register/fields";

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const identifier = String(data.get("identifier") ?? "").trim();
        const password = String(data.get("password") ?? "");
        if (!identifier || !password) return setError("Enter your email or phone and your password.");
        setError(undefined);
        setLoading(true);
        try {
          const { user } = await api<{ user: { role: string } }>("/api/auth/login", { method: "POST", json: { identifier, password } });
          const area = user.role === "admin" ? "/admin" : "/dashboard";
          const next = params.get("next");
          router.replace(next?.startsWith(area) ? next : area);
          router.refresh();
        } catch (err) {
          setError(messageOf(err));
          setLoading(false);
        }
      }}>
      <Input label="Email or phone" name="identifier" autoComplete="username" placeholder="you@company.pk or 3001234567" />
      <Input label="Password" name="password" type="password" autoComplete="current-password" />
      <Link href="/forgot-password" className="-mt-2 block text-sm font-semibold text-blue hover:underline">
        Forgot password?
      </Link>
      {error ? (
        <p role="alert" className="rounded-xl bg-pale px-4 py-3 text-sm text-danger">
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
