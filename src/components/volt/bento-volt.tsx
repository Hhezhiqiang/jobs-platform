"use client";

const SALARY_BUCKETS = [
  { range: "60–80k", h: 22 },
  { range: "80–100k", h: 38 },
  { range: "100–130k", h: 64 },
  { range: "130–160k", h: 92 },
  { range: "160–200k", h: 78 },
  { range: "200–250k", h: 54 },
  { range: "250k+", h: 30 },
];

export function BentoVolt({
  jobCount = 898,
  companyCount = 412,
  dailyNewJobs = 34,
}: {
  jobCount?: number;
  companyCount?: number;
  dailyNewJobs?: number;
}) {
  const STATS = [
    { k: "Live jobs", v: jobCount.toLocaleString(), note: `+${dailyNewJobs} this week` },
    { k: "Companies", v: companyCount.toLocaleString(), note: "Web3 · AI · SaaS" },
    { k: "Avg. salary", v: "$148k", note: "senior eng, remote" },
    { k: "Response", v: "11h", note: "median to first reply" },
  ];
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <div
            className="font-mono text-xs uppercase tracking-widest"
            style={{ color: "var(--fg-mute)" }}
          >
            01 / Pulse
          </div>
          <h2 className="mt-2 text-4xl font-semibold tracking-tight">
            The market, <span className="volt-serif">right now.</span>
          </h2>
        </div>
        <div className="hidden md:block text-sm" style={{ color: "var(--fg-dim)" }}>
          updated every 6h · adzuna + scraped
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:grid-rows-2">
        {/* Stats row */}
        {STATS.map((s, i) => (
          <div key={s.k} className="volt-card">
            <div
              className="font-mono text-[10px] uppercase tracking-widest"
              style={{ color: "var(--fg-mute)" }}
            >
              {s.k}
            </div>
            <div
              className="volt-num mt-3 text-5xl"
              style={{ color: i === 0 ? "var(--volt)" : "var(--fg)" }}
            >
              {s.v}
            </div>
            <div className="mt-3 text-xs" style={{ color: "var(--fg-dim)" }}>
              {s.note}
            </div>
          </div>
        ))}

        {/* Salary chart — spans 2 cols */}
        <div className="volt-card md:col-span-2">
          <div className="flex items-end justify-between">
            <div>
              <div
                className="font-mono text-[10px] uppercase tracking-widest"
                style={{ color: "var(--fg-mute)" }}
              >
                Senior engineer · USD / yr
              </div>
              <div className="mt-2 text-xl font-semibold">Salary distribution</div>
            </div>
            <span className="volt-chip volt-chip-volt">live</span>
          </div>
          <div className="mt-6 flex h-32 items-end gap-2">
            {SALARY_BUCKETS.map((b) => (
              <div key={b.range} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="volt-bar w-full"
                  style={{ height: `${b.h}%` }}
                  title={`${b.range}`}
                />
                <div
                  className="font-mono text-[9px] uppercase"
                  style={{ color: "var(--fg-mute)" }}
                >
                  {b.range}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tagline card */}
        <div
          className="volt-card md:col-span-2"
          style={{
            background:
              "radial-gradient(120% 80% at 100% 0%, rgba(182,255,61,0.12), transparent 60%), var(--ink-2)",
          }}
        >
          <div
            className="font-mono text-[10px] uppercase tracking-widest"
            style={{ color: "var(--fg-mute)" }}
          >
            Why JobQuip
          </div>
          <p className="mt-4 text-2xl leading-snug">
            We <span className="volt-serif">strip the noise</span> — no
            recruiter spam, no ghost listings, no &ldquo;exciting opportunity in
            a dynamic environment.&rdquo; Just real roles, with the salary
            attached.
          </p>
          <div
            className="mt-6 flex items-center gap-3 font-mono text-xs"
            style={{ color: "var(--fg-dim)" }}
          >
            <span>·</span>
            <span>verified pay band</span>
            <span>·</span>
            <span>founder-readable</span>
            <span>·</span>
            <span>1-click apply</span>
          </div>
        </div>
      </div>
    </section>
  );
}
