"use client";

import Link from "next/link";

const TICKER = [
  "Solidity", "Rust", "Go", "React", "TypeScript", "Move",
  "Foundry", "PostgreSQL", "AWS", "Kubernetes", "GraphQL", "Python",
  "Vue", "Solana", "Cosmos", "ZK", "Cairo", "Polkadot",
];

export function HeroVolt({ locale = "zh" }: { locale?: string }) {
  return (
    <section className="volt-grain relative overflow-hidden">
      {/* Glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[600px] w-[900px] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(182,255,61,0.18), transparent 70%)",
        }}
      />
      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-24 pb-20">
        <div className="mb-8 flex items-center gap-3">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--volt)", boxShadow: "0 0 12px var(--volt)" }}
          />
          <span className="font-mono text-xs" style={{ color: "var(--fg-dim)" }}>
            898 live roles · refreshed {new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>

        <h1 className="volt-rise text-[clamp(2.6rem,8vw,6.5rem)] font-semibold leading-[0.95] tracking-[-0.03em]">
          Find work that <span className="volt-serif" style={{ color: "var(--volt)" }}>doesn&rsquo;t suck.</span>
          <br />
          <span style={{ color: "var(--fg-dim)" }}>Built for the </span>
          <span>builder economy.</span>
        </h1>

        <p
          className="volt-rise-2 mt-8 max-w-2xl text-lg leading-relaxed"
          style={{ color: "var(--fg-dim)" }}
        >
          Real-time aggregation across Web3, AI, and frontier-tech.
          Match scoring, salary signal, and a one-click apply that actually
          reaches a human.
        </p>

        <div className="volt-rise-3 mt-10 flex flex-wrap items-center gap-4">
          <Link href={`/${locale}/jobs`} className="volt-btn">
            Browse 898 jobs <span aria-hidden>→</span>
          </Link>
          <Link href={`/${locale}/salary-insights`} className="volt-btn-ghost">
            Salary intel
          </Link>
          <div
            className="ml-2 flex items-center gap-2 font-mono text-xs"
            style={{ color: "var(--fg-mute)" }}
          >
            <kbd
              className="rounded px-1.5 py-0.5"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              /
            </kbd>
            to search
          </div>
        </div>

        {/* Tech ticker */}
        <div
          className="relative mt-20 overflow-hidden border-y py-5"
          style={{ borderColor: "var(--line)" }}
        >
          <div className="volt-marquee">
            {[...TICKER, ...TICKER].map((t, i) => (
              <span
                key={i}
                className="font-mono text-sm uppercase tracking-widest"
                style={{ color: i % 5 === 2 ? "var(--volt)" : "var(--fg-mute)" }}
              >
                {t}
                <span className="ml-12 opacity-40">/</span>
              </span>
            ))}
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-32"
            style={{
              background:
                "linear-gradient(to right, var(--ink), transparent)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-32"
            style={{
              background:
                "linear-gradient(to left, var(--ink), transparent)",
            }}
          />
        </div>
      </div>
    </section>
  );
}
