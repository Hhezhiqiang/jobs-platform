import { HeaderVolt } from "@/components/volt/header-volt";
import { FooterVolt } from "@/components/volt/footer-volt";
import { HeroVolt } from "@/components/volt/hero-volt";
import { BentoVolt } from "@/components/volt/bento-volt";
import { JobCardVolt, VoltJob } from "@/components/volt/job-card-volt";
import Link from "next/link";

const SAMPLE: VoltJob[] = [
  {
    id: "sample-1",
    title: "Senior Solidity Engineer",
    company: "Lighthouse Labs",
    location: "Remote · EU",
    salaryMin: 160000,
    salaryMax: 220000,
    tags: ["Solidity", "Foundry", "EVM"],
    match: 94,
    remote: true,
    postedDays: 0,
  },
  {
    id: "sample-2",
    title: "Staff Frontend Engineer",
    company: "Nimbus",
    location: "San Francisco",
    salaryMin: 190000,
    salaryMax: 260000,
    tags: ["React", "TypeScript", "Web3"],
    match: 88,
    remote: false,
    postedDays: 2,
  },
  {
    id: "sample-3",
    title: "Rust Protocol Developer",
    company: "Parallax",
    location: "Remote · Global",
    salaryMin: 140000,
    salaryMax: 200000,
    tags: ["Rust", "Substrate", "ZK"],
    match: 82,
    remote: true,
    postedDays: 1,
  },
  {
    id: "sample-4",
    title: "Product Designer, DeFi",
    company: "Helix",
    location: "London",
    salaryMin: 110000,
    salaryMax: 150000,
    tags: ["Figma", "Design Sys", "DeFi"],
    match: 76,
    remote: true,
    postedDays: 3,
  },
  {
    id: "sample-5",
    title: "DevOps Engineer",
    company: "ChainGuard",
    location: "Remote · Americas",
    salaryMin: 130000,
    salaryMax: 180000,
    tags: ["K8s", "Terraform", "AWS"],
    match: 71,
    remote: true,
    postedDays: 4,
  },
  {
    id: "sample-6",
    title: "AI Research Engineer",
    company: "Quanta",
    location: "Berlin",
    salaryMin: 150000,
    salaryMax: 210000,
    tags: ["PyTorch", "LLM", "CUDA"],
    match: 89,
    remote: false,
    postedDays: 0,
  },
];

export default async function VoltHome({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const { locale } = await params;
  return (
    <>
      <HeaderVolt locale={locale} />
      <main>
        <HeroVolt locale={locale} />
        <BentoVolt />

        {/* Featured jobs */}
        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <div
                className="font-mono text-xs uppercase tracking-widest"
                style={{ color: "var(--fg-mute)" }}
              >
                02 / Featured
              </div>
              <h2 className="mt-2 text-4xl font-semibold tracking-tight">
                Roles worth <span className="volt-serif">your inbox.</span>
              </h2>
            </div>
            <Link
              href={`/${locale}/jobs`}
              className="volt-btn-ghost hidden md:inline-flex text-sm"
            >
              All 898 jobs →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {SAMPLE.map((j) => (
              <JobCardVolt key={j.id} job={j} locale={locale} />
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="volt-grain relative mx-auto max-w-7xl overflow-hidden rounded-3xl border px-6 py-24 my-20"
          style={{ borderColor: "var(--line)" }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 80% at 50% 100%, rgba(182,255,61,0.10), transparent 70%)",
            }}
          />
          <div className="relative z-10 text-center">
            <h2 className="text-[clamp(2rem,5vw,4rem)] font-semibold leading-tight tracking-tight">
              Ship the application.
              <br />
              <span className="volt-serif" style={{ color: "var(--volt)" }}>
                Not the cover letter.
              </span>
            </h2>
            <p
              className="mx-auto mt-6 max-w-xl text-base"
              style={{ color: "var(--fg-dim)" }}
            >
              Paste a profile URL, pick a role, hit send. We&rsquo;ll handle
              the rest — and tell you when a human reads it.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Link href={`/${locale}/auth/signup`} className="volt-btn">
                Start free <span aria-hidden>→</span>
              </Link>
              <Link href={`/${locale}/about`} className="volt-btn-ghost">
                How it works
              </Link>
            </div>
          </div>
        </section>
      </main>
      <FooterVolt locale={locale} />
    </>
  );
}
