import Link from "next/link";

const COLS = [
  {
    head: "Product",
    items: ["Jobs", "Companies", "Salary", "Career Trail", "Topics"],
  },
  {
    head: "Resource",
    items: ["Blog", "FAQ", "Job Demands", "Aggregated Jobs", "RSS"],
  },
  {
    head: "Company",
    items: ["About", "Contact", "Affiliate", "Privacy", "Terms"],
  },
];

export function FooterVolt({ locale = "zh" }: { locale?: string }) {
  return (
    <footer className="mt-32 border-t" style={{ borderColor: "var(--line)" }}>
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <div
                className="h-7 w-7 rounded-md grid place-items-center"
                style={{ background: "var(--volt)", color: "#0a0a0a" }}
              >
                <span className="font-bold text-sm">J</span>
              </div>
              <span className="font-semibold tracking-tight">JobQuip</span>
            </div>
            <p
              className="mt-4 max-w-xs text-sm leading-relaxed"
              style={{ color: "var(--fg-dim)" }}
            >
              <span className="volt-serif text-base">A new way</span> to find
              Web3 &amp; tech jobs.<br />
              Built for makers who actually ship.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {["GH", "TG", "X", "in"].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="grid h-9 w-9 place-items-center rounded-full border text-xs"
                  style={{ borderColor: "var(--line-2)", color: "var(--fg-dim)" }}
                >
                  {s}
                </a>
              ))}
            </div>
          </div>

          {COLS.map((col) => (
            <div key={col.head}>
              <h4
                className="mb-4 font-mono text-xs uppercase tracking-widest"
                style={{ color: "var(--fg-mute)" }}
              >
                {col.head}
              </h4>
              <ul className="space-y-2.5 text-sm">
                {col.items.map((it) => (
                  <li key={it}>
                    <Link
                      href={`/${locale}`}
                      className="volt-link text-[color:var(--fg-dim)] hover:text-[color:var(--fg)]"
                    >
                      {it}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="mt-16 flex flex-col gap-3 border-t pt-6 text-xs md:flex-row md:items-center md:justify-between"
          style={{ borderColor: "var(--line)", color: "var(--fg-mute)" }}
        >
          <div>© {new Date().getFullYear()} JobQuip. All systems nominal.</div>
          <div className="flex items-center gap-2 font-mono">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--volt)" }} />
            api.jobquip.com · 99.98% uptime · 90d
          </div>
        </div>
      </div>
    </footer>
  );
}
