"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon, CheckIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Controller, useForm, type FieldPath } from "react-hook-form";

import { CheckCards, FileField, Input, Select } from "./fields";
import { CITIES, SERVICES, STEPS, conditionalErrors, schema, type Application } from "./schema";

const DRAFT_KEY = "mc-partner-application";

const companyTypes = [
  { value: "private-limited", label: "Private limited company" },
  { value: "partnership", label: "Registered partnership firm" },
  { value: "sole-proprietor", label: "Sole proprietorship" },
  { value: "public-limited", label: "Public limited company" },
];

const empty: Application = {
  legalName: "",
  tradingName: "",
  companyType: "",
  registrationNo: "",
  ntn: "",
  yearEstablished: "",
  city: "",
  address: "",
  services: [],
  cities: [],
  driverCount: "",
  guardCount: "",
  securityLicenceNo: "",
  securityLicenceExpiry: "",
  docRegistration: "",
  docNtn: "",
  docLicence: "",
  contactName: "",
  designation: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
  agree: false as unknown as true,
};

export function RegisterForm() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState<string>();
  const reduce = useReducedMotion();

  const form = useForm<Application>({
    resolver: zodResolver(schema),
    defaultValues: empty,
    mode: "onTouched",
  });
  const { register, control, watch, trigger, handleSubmit, formState, getValues, reset, setError, setFocus } = form;
  const { errors, isSubmitting } = formState;
  const services = watch("services");
  const security = services.some((s) => s !== "drivers");
  const armed = services.includes("armed") || services.includes("teams");

  // Restore a saved draft (passwords and files are never stored).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) reset({ ...empty, ...JSON.parse(raw) });
    } catch {}
  }, [reset]);

  useEffect(() => {
    const sub = watch((v) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, confirmPassword, docRegistration, docNtn, docLicence, ...safe } = v;
        localStorage.setItem(DRAFT_KEY, JSON.stringify(safe));
      } catch {}
    });
    return () => sub.unsubscribe();
  }, [watch]);

  const go = (to: number) => {
    setStep(to);
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  const next = async () => {
    const fields = STEPS[step].fields as unknown as FieldPath<Application>[];
    const ok = await trigger(fields, { shouldFocus: true });
    if (!ok) return;
    const extra = Object.entries(conditionalErrors(getValues())).filter(([k]) => fields.includes(k as FieldPath<Application>));
    if (extra.length) {
      extra.forEach(([k, message]) => setError(k as FieldPath<Application>, { type: "custom", message }));
      setFocus(extra[0][0] as FieldPath<Application>);
      return;
    }
    go(step + 1);
  };

  // TODO(backend): POST /partners/applications with multipart uploads.
  const submit = handleSubmit(async () => {
    await new Promise((r) => setTimeout(r, 1200));
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
    setSubmitted(`MCP-${Math.floor(100000 + Math.random() * 900000)}`);
  });

  if (submitted) return <Submitted reference={submitted} email={getValues("email")} />;

  const err = (name: keyof Application) => errors[name]?.message as string | undefined;

  return (
    <div className="grid gap-10 lg:grid-cols-[240px_1fr] lg:gap-16">
      <Stepper step={step} onJump={(i) => i < step && go(i)} />

      <form onSubmit={submit} noValidate className="min-w-0">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={reduce ? false : { opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: -16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8">
            {step === 0 ? (
              <>
                <StepHead title="Company details" body="As they appear on your registration documents." />
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Input label="Registered company name" autoComplete="organization" error={err("legalName")} {...register("legalName")} />
                  </div>
                  <Input label="Trading name (optional)" hint="If customers know you by another name." {...register("tradingName")} />
                  <Select label="Company type" options={companyTypes} error={err("companyType")} {...register("companyType")} />
                  <Input label="SECP or firm registration number" error={err("registrationNo")} {...register("registrationNo")} />
                  <Input label="NTN" inputMode="numeric" placeholder="1234567-8" error={err("ntn")} {...register("ntn")} />
                  <Input label="Year established" inputMode="numeric" placeholder="2015" maxLength={4} error={err("yearEstablished")} {...register("yearEstablished")} />
                  <Select
                    label="Head office city"
                    options={CITIES.map((c) => ({ value: c, label: c }))}
                    error={err("city")}
                    {...register("city")}
                  />
                  <div className="sm:col-span-2">
                    <Input label="Office address" autoComplete="street-address" error={err("address")} {...register("address")} />
                  </div>
                </div>
              </>
            ) : null}

            {step === 1 ? (
              <>
                <StepHead title="Services and coverage" body="Tell us what your company can provide through My Captain." />
                <div className="space-y-3">
                  <p className="text-sm font-medium">Services offered</p>
                  <Controller
                    control={control}
                    name="services"
                    render={({ field }) => <CheckCards options={SERVICES} value={field.value} onChange={field.onChange} />}
                  />
                  {err("services") ? <p role="alert" className="text-sm text-danger">{err("services")}</p> : null}
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  {services.includes("drivers") ? (
                    <Input label="Number of drivers" inputMode="numeric" error={err("driverCount")} {...register("driverCount")} />
                  ) : null}
                  {security ? (
                    <Input label="Number of guards" inputMode="numeric" error={err("guardCount")} {...register("guardCount")} />
                  ) : null}
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-medium">Cities you can serve</p>
                  <Controller
                    control={control}
                    name="cities"
                    render={({ field }) => (
                      <div className="flex flex-wrap gap-2">
                        {CITIES.map((c) => {
                          const on = field.value.includes(c);
                          return (
                            <button
                              key={c}
                              type="button"
                              aria-pressed={on}
                              onClick={() => field.onChange(on ? field.value.filter((x) => x !== c) : [...field.value, c])}
                              className={`inline-flex h-10 items-center gap-1.5 rounded-xl border px-4 text-sm font-medium transition active:scale-[0.98] ${
                                on ? "border-navy bg-navy text-white" : "border-line hover:bg-surface"
                              }`}>
                              {on ? <CheckIcon size={14} weight="bold" /> : null}
                              {c}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  />
                  {err("cities") ? <p role="alert" className="text-sm text-danger">{err("cities")}</p> : null}
                </div>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <StepHead title="Licences and documents" body="Scans or clear photos are fine. We verify every document before approval." />
                {security ? (
                  <div className="grid gap-6 sm:grid-cols-2">
                    <Input label="Security licence number" error={err("securityLicenceNo")} {...register("securityLicenceNo")} />
                    <Input label="Licence expiry" type="date" error={err("securityLicenceExpiry")} {...register("securityLicenceExpiry")} />
                  </div>
                ) : null}
                <div className="grid gap-6 sm:grid-cols-2">
                  <Controller
                    control={control}
                    name="docRegistration"
                    render={({ field }) => (
                      <FileField label="Registration certificate" file={field.value} onChange={(v) => field.onChange(v ?? "")} error={err("docRegistration")} />
                    )}
                  />
                  <Controller
                    control={control}
                    name="docNtn"
                    render={({ field }) => (
                      <FileField label="NTN certificate" file={field.value} onChange={(v) => field.onChange(v ?? "")} error={err("docNtn")} />
                    )}
                  />
                  {security ? (
                    <Controller
                      control={control}
                      name="docLicence"
                      render={({ field }) => (
                        <FileField
                          label={armed ? "Security licence" : "Security licence (recommended)"}
                          file={field.value}
                          onChange={(v) => field.onChange(v ?? "")}
                          error={err("docLicence")}
                        />
                      )}
                    />
                  ) : null}
                </div>
                <p className="text-sm text-muted">
                  Staff documents (CNIC, driving and arms licences, police certificates) are added per person after approval.
                </p>
              </>
            ) : null}

            {step === 3 ? (
              <>
                <StepHead title="Contact person and account" body="This person manages your partner account and receives booking alerts." />
                <div className="grid gap-6 sm:grid-cols-2">
                  <Input label="Full name" autoComplete="name" error={err("contactName")} {...register("contactName")} />
                  <Input label="Designation" placeholder="Operations Manager" error={err("designation")} {...register("designation")} />
                  <Input label="Mobile number" prefix="+92" inputMode="numeric" placeholder="3001234567" maxLength={10} autoComplete="tel-national" error={err("phone")} {...register("phone")} />
                  <Input label="Work email" type="email" autoComplete="email" error={err("email")} {...register("email")} />
                  <Input label="Password" type="password" autoComplete="new-password" hint="At least 8 characters." error={err("password")} {...register("password")} />
                  <Input label="Confirm password" type="password" autoComplete="new-password" error={err("confirmPassword")} {...register("confirmPassword")} />
                </div>
                <label className="flex cursor-pointer items-start gap-3 text-sm">
                  <input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-[var(--blue)]" {...register("agree")} />
                  <span className="text-muted">
                    I confirm the information is accurate and accept the{" "}
                    <Link href="/terms" className="font-medium text-blue hover:underline">partner terms</Link> and{" "}
                    <Link href="/privacy" className="font-medium text-blue hover:underline">privacy policy</Link>.
                  </span>
                </label>
                {err("agree") ? <p role="alert" className="-mt-4 text-sm text-danger">{err("agree")}</p> : null}
              </>
            ) : null}

            {step === 4 ? <Review values={getValues()} onEdit={go} /> : null}

            <div className="flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => go(step - 1)}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 font-semibold text-muted transition hover:bg-surface hover:text-ink">
                  <ArrowLeftIcon size={18} />
                  Back
                </button>
              ) : (
                <span className="text-sm text-faint">Progress is saved on this device.</span>
              )}
              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={next}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue px-6 font-semibold text-white transition hover:bg-blue-hover active:scale-[0.98]">
                  Continue
                  <ArrowRightIcon size={18} weight="bold" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue px-6 font-semibold text-white transition hover:bg-blue-hover active:scale-[0.98] disabled:opacity-60">
                  {isSubmitting ? "Submitting..." : "Submit application"}
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </form>
    </div>
  );
}

function StepHead({ title, body }: { title: string; body: string }) {
  return (
    <div className="space-y-2">
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      <p className="text-muted">{body}</p>
    </div>
  );
}

function Stepper({ step, onJump }: { step: number; onJump: (i: number) => void }) {
  return (
    <nav aria-label="Application progress">
      {/* Phones: compact progress bar */}
      <div className="lg:hidden">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-semibold">{STEPS[step].title}</span>
          <span className="text-muted">
            {step + 1} of {STEPS.length}
          </span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface">
          <div className="h-full rounded-full bg-blue transition-all duration-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
      </div>
      {/* Desktop: vertical list */}
      <ol className="sticky top-28 hidden space-y-1 lg:block">
        {STEPS.map((s, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <li key={s.key}>
              <button
                type="button"
                disabled={!done}
                onClick={() => onJump(i)}
                aria-current={current ? "step" : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  current ? "bg-pale font-semibold text-ink" : done ? "text-ink hover:bg-surface" : "text-faint"
                }`}>
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                    done ? "bg-success text-white" : current ? "bg-blue text-white" : "border border-line"
                  }`}>
                  {done ? <CheckIcon size={14} weight="bold" /> : i + 1}
                </span>
                {s.title}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function Review({ values: v, onEdit }: { values: Application; onEdit: (step: number) => void }) {
  const serviceLabels = SERVICES.filter((s) => v.services.includes(s.value)).map((s) => s.label);
  const groups: { title: string; step: number; rows: [string, string | undefined][] }[] = [
    {
      title: "Company",
      step: 0,
      rows: [
        ["Name", v.legalName],
        ["Trading as", v.tradingName || undefined],
        ["Registration", v.registrationNo],
        ["NTN", v.ntn],
        ["Established", v.yearEstablished],
        ["Office", `${v.address}, ${v.city}`],
      ],
    },
    {
      title: "Services",
      step: 1,
      rows: [
        ["Offers", serviceLabels.join(", ")],
        ["Drivers", v.driverCount || undefined],
        ["Guards", v.guardCount || undefined],
        ["Cities", v.cities.join(", ")],
      ],
    },
    {
      title: "Licences",
      step: 2,
      rows: [
        ["Security licence", v.securityLicenceNo || undefined],
        ["Expires", v.securityLicenceExpiry || undefined],
        ["Documents", [v.docRegistration, v.docNtn, v.docLicence].filter(Boolean).length + " uploaded"],
      ],
    },
    {
      title: "Account",
      step: 3,
      rows: [
        ["Contact", `${v.contactName}, ${v.designation}`],
        ["Mobile", `+92 ${v.phone}`],
        ["Email", v.email],
      ],
    },
  ];

  return (
    <>
      <StepHead title="Review your application" body="Check the details below, then submit for verification." />
      <div className="space-y-4">
        {groups.map((g) => (
          <section key={g.title} className="rounded-2xl border border-line p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{g.title}</h3>
              <button
                type="button"
                onClick={() => onEdit(g.step)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue hover:underline">
                <PencilSimpleIcon size={15} />
                Edit
              </button>
            </div>
            <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[160px_1fr]">
              {g.rows
                .filter(([, val]) => val)
                .map(([k, val]) => (
                  <div key={k} className="contents">
                    <dt className="text-muted">{k}</dt>
                    <dd className="font-medium break-words">{val}</dd>
                  </div>
                ))}
            </dl>
          </section>
        ))}
      </div>
    </>
  );
}

function Submitted({ reference, email }: { reference: string; email: string }) {
  return (
    <div className="mx-auto max-w-xl py-10 text-center">
      <CheckCircleIcon size={64} weight="fill" className="mx-auto text-success" />
      <h2 className="mt-6 text-3xl font-bold tracking-tight">Application received</h2>
      <p className="mt-3 text-muted">
        Reference <span className="font-semibold text-ink">{reference}</span>. We sent a confirmation to {email}.
      </p>
      <div className="mt-10 space-y-4 rounded-2xl border border-line p-6 text-left">
        <p className="font-semibold">What happens next</p>
        {[
          "Our partner team verifies your documents within 3 to 5 working days.",
          "We may call to arrange a short office visit for security companies.",
          "Once approved, sign in to add your drivers and guards and start receiving bookings.",
        ].map((t) => (
          <p key={t} className="flex gap-3 text-sm text-muted">
            <CheckIcon size={18} weight="bold" className="mt-0.5 shrink-0 text-blue" />
            {t}
          </p>
        ))}
      </div>
      <Link href="/" className="mt-8 inline-flex h-12 items-center rounded-xl border border-line px-6 font-semibold hover:bg-surface">
        Back to home
      </Link>
    </div>
  );
}
