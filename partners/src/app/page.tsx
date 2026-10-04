import {
  ArrowRightIcon,
  BuildingsIcon,
  CalendarCheckIcon,
  CaretDownIcon,
  CheckCircleIcon,
  ClipboardTextIcon,
  IdentificationBadgeIcon,
  MapPinAreaIcon,
  ShieldCheckIcon,
  SteeringWheelIcon,
  UsersThreeIcon,
  WalletIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const flow = [
  { icon: ClipboardTextIcon, title: "Apply", body: "Share company details, services and licences. It takes about ten minutes." },
  { icon: IdentificationBadgeIcon, title: "Get verified", body: "We check registration, licences and a sample of staff records within 3 to 5 working days." },
  { icon: UsersThreeIcon, title: "Add your team", body: "Create logins for your drivers and guards. They sign in to the My Captain app with them." },
  { icon: CalendarCheckIcon, title: "Receive bookings", body: "Customers book in the app. Your team gets assignments; you see every duty live." },
];

const requirements = {
  security: [
    "Valid security company licence from the provincial Home Department or PSRA",
    "Arms licences for every armed guard you list",
    "Police character certificates for all personnel",
    "Uniforms and a duty supervisor reachable 24 hours",
  ],
  drivers: [
    "Company registered with SECP or as a registered firm",
    "Valid LTV or HTV licence for every driver",
    "CNIC and police character certificate per driver",
    "At least one year of documented driving experience per driver",
  ],
};

const faqs = [
  {
    q: "How much does it cost to join?",
    a: "Registration is free. My Captain keeps a service fee on each completed booking; the rate is shared during verification and set out in the partner terms.",
  },
  {
    q: "How and when are we paid?",
    a: "Customers pay inside the app. Your earnings for completed duties are transferred to your company bank account every week, with a statement for each payout.",
  },
  {
    q: "Can we keep our own clients?",
    a: "Yes. My Captain only sends you additional bookings. Nothing stops you serving your existing customers directly.",
  },
  {
    q: "Who manages our drivers and guards?",
    a: "You do. You create their accounts, set availability and approve replacements. My Captain handles booking, tracking, payments and customer support.",
  },
  {
    q: "Which cities are covered?",
    a: "We are launching in Karachi, Lahore and Islamabad. Companies in other cities can apply now and will be onboarded as each city opens.",
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl gap-12 px-4 pt-14 pb-20 sm:px-6 md:pt-20 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-16">
          <div className="space-y-7">
            <h1 className="rise text-4xl font-bold leading-[1.08] tracking-tight md:text-5xl lg:text-[3.4rem]">
              Grow your driver or security company with My Captain.
            </h1>
            <p className="rise rise-2 max-w-[52ch] text-lg leading-relaxed text-muted">
              Get verified bookings from customers across Pakistan. You keep your team; we handle bookings, tracking and payments.
            </p>
            <div className="rise rise-3 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-blue px-6 font-semibold text-white transition hover:bg-blue-hover active:scale-[0.98]">
                Apply now
                <ArrowRightIcon size={18} weight="bold" />
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex h-12 items-center rounded-xl border border-line px-6 font-semibold transition hover:bg-surface active:scale-[0.98]">
                Partner sign in
              </Link>
            </div>
          </div>

          <div className="rise rise-3 rounded-3xl bg-navy p-7 text-white sm:p-9">
            <p className="text-sm font-medium text-navy-text">Who can apply</p>
            <ul className="mt-6 space-y-6">
              {[
                { icon: ShieldCheckIcon, t: "Licensed security companies", d: "Unarmed guards, armed personnel and teams" },
                { icon: SteeringWheelIcon, t: "Driver and chauffeur agencies", d: "Drivers for customers' own vehicles" },
                { icon: BuildingsIcon, t: "Facility service providers", d: "Offering either service, with five or more staff" },
              ].map(({ icon: Icon, t, d }) => (
                <li key={t} className="flex gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/10">
                    <Icon size={22} />
                  </span>
                  <span>
                    <span className="block font-semibold">{t}</span>
                    <span className="block text-sm text-navy-text">{d}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-8 border-t border-white/10 pt-6 text-sm text-navy-text">
              Launching in Karachi, Lahore and Islamabad.
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-20 border-y border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">From application to first booking</h2>
            <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
              {flow.map(({ icon: Icon, title, body }) => (
                <div key={title} className="space-y-4 bg-elevated p-7">
                  <Icon size={28} className="text-blue" />
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits bento */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="max-w-xl text-3xl font-bold tracking-tight md:text-4xl">Built for companies that run real teams</h2>
          <div className="mt-12 grid gap-4 md:grid-cols-3 md:grid-rows-2">
            <div className="flex flex-col justify-between gap-10 rounded-3xl bg-blue p-8 text-white md:col-span-2">
              <MapPinAreaIcon size={32} />
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold">Every duty, tracked live</h3>
                <p className="max-w-md text-white/80">
                  See where your drivers and guards are, who has checked in, and which posts need attention, from one dashboard.
                </p>
              </div>
            </div>
            <div className="flex flex-col justify-between gap-8 rounded-3xl bg-pale p-8">
              <WalletIcon size={30} className="text-blue" />
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Weekly payouts</h3>
                <p className="text-sm text-muted">Customers pay in the app. No cash handling and no chasing invoices.</p>
              </div>
            </div>
            <div className="flex flex-col justify-between gap-8 rounded-3xl border border-line p-8">
              <CalendarCheckIcon size={30} className="text-blue" />
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Steady demand</h3>
                <p className="text-sm text-muted">Hourly, daily, monthly and contract bookings fill gaps in your roster.</p>
              </div>
            </div>
            <div className="flex flex-col justify-between gap-8 rounded-3xl bg-navy p-8 text-white md:col-span-2">
              <ShieldCheckIcon size={30} />
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Support when something goes wrong</h3>
                <p className="max-w-lg text-navy-text">
                  Accidents, complaints and replacements are logged with duty records and evidence, and our operations team works them with you.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Requirements */}
        <section id="requirements" className="scroll-mt-20 border-t border-line">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_2fr]">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">What you will need</h2>
              <p className="text-muted">Keep scans of these ready. You can save the form and finish later.</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {[
                { title: "Security companies", icon: ShieldCheckIcon, items: requirements.security },
                { title: "Driver agencies", icon: SteeringWheelIcon, items: requirements.drivers },
              ].map(({ title, icon: Icon, items }) => (
                <div key={title} className="rounded-2xl border border-line p-7">
                  <div className="flex items-center gap-3">
                    <Icon size={24} className="text-blue" />
                    <h3 className="font-semibold">{title}</h3>
                  </div>
                  <ul className="mt-6 space-y-4">
                    {items.map((i) => (
                      <li key={i} className="flex gap-3 text-sm leading-relaxed text-muted">
                        <CheckCircleIcon size={18} weight="fill" className="mt-0.5 shrink-0 text-success" />
                        {i}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 bg-surface">
          <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Questions partners ask</h2>
            <div className="mt-10 divide-y divide-line rounded-2xl border border-line bg-elevated">
              {faqs.map((f) => (
                <details key={f.q} className="group px-6 py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-semibold">
                    {f.q}
                    <CaretDownIcon size={18} className="shrink-0 text-muted transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 max-w-[65ch] text-sm leading-relaxed text-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-8 rounded-3xl bg-navy p-8 text-white sm:p-12 md:flex-row md:items-center">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Ready to take bookings?</h2>
              <p className="text-navy-text">Applications are reviewed within 3 to 5 working days.</p>
            </div>
            <Link
              href="/register"
              className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-white px-6 font-semibold text-[#101c30] transition hover:bg-white/90 active:scale-[0.98]">
              Apply now
              <ArrowRightIcon size={18} weight="bold" />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
