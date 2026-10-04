"use client";

import { CaretDownIcon, CheckIcon, FileArrowUpIcon, XIcon } from "@phosphor-icons/react";
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";

const control =
  "h-12 w-full rounded-xl border bg-elevated px-4 text-[15px] text-ink outline-none transition placeholder:text-faint focus:border-blue focus:ring-4 focus:ring-blue/15";

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  htmlFor: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="text-sm text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string; prefix?: string };

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, hint, error, prefix, id, ...rest }, ref) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={inputId}>
      <div className="relative">
        {prefix ? (
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[15px] font-semibold text-ink">
            {prefix}
          </span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          className={`${control} ${error ? "border-danger" : "border-line"} ${prefix ? "pl-14" : ""}`}
          {...rest}
        />
      </div>
    </Field>
  );
});

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, options, placeholder = "Select", id, ...rest },
  ref,
) {
  const auto = useId();
  const selectId = id ?? auto;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={selectId}>
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={!!error}
          className={`${control} appearance-none pr-11 ${error ? "border-danger" : "border-line"}`}
          {...rest}>
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <CaretDownIcon size={18} className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-muted" />
      </div>
    </Field>
  );
});

// Multi-select as tappable cards.
export function CheckCards({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string; hint: string }[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((o) => {
        const on = value.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            role="checkbox"
            aria-checked={on}
            onClick={() => onChange(on ? value.filter((v) => v !== o.value) : [...value, o.value])}
            className={`flex items-start gap-3 rounded-xl border p-4 text-left transition active:scale-[0.99] ${
              on ? "border-blue bg-pale" : "border-line bg-elevated hover:bg-surface"
            }`}>
            <span
              className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border ${
                on ? "border-blue bg-blue text-white" : "border-faint"
              }`}>
              {on ? <CheckIcon size={13} weight="bold" /> : null}
            </span>
            <span>
              <span className="block font-semibold">{o.label}</span>
              <span className="block text-sm text-muted">{o.hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function FileField({
  label,
  hint,
  error,
  file,
  onChange,
}: {
  label: string;
  hint?: string;
  error?: string;
  file?: string;
  onChange: (name: string | undefined) => void;
}) {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error} htmlFor={id}>
      {file ? (
        <div className="flex h-12 items-center gap-3 rounded-xl border border-line bg-surface px-4">
          <CheckIcon size={18} weight="bold" className="text-success" />
          <span className="flex-1 truncate text-sm font-medium">{file}</span>
          <button type="button" onClick={() => onChange(undefined)} aria-label={`Remove ${file}`} className="text-muted hover:text-ink">
            <XIcon size={18} />
          </button>
        </div>
      ) : (
        <label
          htmlFor={id}
          className={`flex h-12 cursor-pointer items-center gap-3 rounded-xl border border-dashed px-4 text-sm text-muted transition hover:border-blue hover:text-ink ${
            error ? "border-danger" : "border-line"
          }`}>
          <FileArrowUpIcon size={20} className="text-blue" />
          Upload PDF or image, up to 10 MB
          <input
            id={id}
            type="file"
            accept=".pdf,image/*"
            className="sr-only"
            onChange={(e) => onChange(e.target.files?.[0]?.name)}
          />
        </label>
      )}
    </Field>
  );
}
