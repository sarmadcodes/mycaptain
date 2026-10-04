import Link from "next/link";

import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xs space-y-3">
          <Logo />
          <p className="text-sm leading-relaxed text-muted">
            The partner network behind My Captain, Pakistan&apos;s on-demand driver and security app.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3">
          <div className="space-y-3">
            <p className="font-semibold">Partners</p>
            <Link href="/register" className="block text-muted hover:text-ink">Apply</Link>
            <Link href="/sign-in" className="block text-muted hover:text-ink">Sign in</Link>
            <Link href="/#requirements" className="block text-muted hover:text-ink">Requirements</Link>
          </div>
          <div className="space-y-3">
            <p className="font-semibold">Support</p>
            <a href="mailto:partners@mycaptain.pk" className="block text-muted hover:text-ink">partners@mycaptain.pk</a>
            <a href="tel:+922100000000" className="block text-muted hover:text-ink">021 0000 0000</a>
          </div>
          <div className="space-y-3">
            <p className="font-semibold">Legal</p>
            <Link href="/terms" className="block text-muted hover:text-ink">Partner terms</Link>
            <Link href="/privacy" className="block text-muted hover:text-ink">Privacy</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-faint sm:px-6">
          © {new Date().getFullYear()} My Captain. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
