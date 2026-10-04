// Wordmark: a simple square monogram plus the name in display type.
export function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        aria-hidden
        className={`grid size-8 place-items-center rounded-lg text-sm font-bold ${
          inverse ? "bg-white text-[#101c30]" : "bg-navy text-white"
        }`}>
        MC
      </span>
      <span className={`text-[15px] font-bold tracking-tight ${inverse ? "text-white" : "text-ink"}`}>
        My Captain <span className={inverse ? "font-medium text-navy-text" : "font-medium text-muted"}>Partners</span>
      </span>
    </span>
  );
}
