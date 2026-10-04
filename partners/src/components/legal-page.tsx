import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function LegalPage({ title, updated, sections }: { title: string; updated: string; sections: { h: string; p: string }[] }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-14 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-faint">Last updated {updated}. Draft for review by legal counsel.</p>
        <div className="mt-10 space-y-8">
          {sections.map((s) => (
            <section key={s.h} className="space-y-2">
              <h2 className="text-lg font-semibold">{s.h}</h2>
              <p className="max-w-[65ch] leading-relaxed text-muted">{s.p}</p>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
