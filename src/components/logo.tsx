/**
 * Meza's mark: a sufuria resting on the three hearth stones (mafiga), with a
 * leaf of sukuma rising from it. The mafiga is where the Kenyan family meal
 * has always started.
 */
export function Mark({ size = 32, tone = "color" }: { size?: number; tone?: "color" | "light" }) {
  const pot = tone === "light" ? "#F5EFE4" : "#1D4532";
  const leaf = tone === "light" ? "#B9D3A3" : "#5E8A47";
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <path d="M20 3.5c4.6 3.2 5.2 8.6 0 13-5.2-4.4-4.6-9.8 0-13Z" fill={leaf} />
      <path d="M20 7.5v8" stroke={pot} strokeOpacity={0.35} strokeWidth={1} strokeLinecap="round" />
      <path d="M6 18h28a14 13 0 0 1-28 0Z" fill={pot} />
      <circle cx="10" cy="35.5" r="2.7" fill="#D99E22" />
      <circle cx="20" cy="37" r="2.7" fill="#B4502A" />
      <circle cx="30" cy="35.5" r="2.7" fill="#D99E22" />
    </svg>
  );
}

export function Logo({ tone = "color", size = 30 }: { tone?: "color" | "light"; size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Mark size={size} tone={tone} />
      <span
        className={`font-display leading-none ${tone === "light" ? "text-paper" : "text-forest"}`}
        style={{ fontSize: size * 0.92 }}
      >
        meza
      </span>
    </span>
  );
}
