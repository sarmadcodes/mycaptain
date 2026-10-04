import Link from "next/link";

import { Logo } from "./logo";

const nav = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#requirements", label: "Requirements" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" aria-label="My Captain Partners home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="text-sm font-medium text-muted transition-colors hover:text-ink">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/sign-in"
            className="hidden h-10 items-center rounded-xl px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface sm:inline-flex">
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex h-10 items-center rounded-xl bg-blue px-4 text-sm font-semibold text-white transition hover:bg-blue-hover active:scale-[0.98]">
            Apply now
          </Link>
        </div>
      </div>
    </header>
  );
}
