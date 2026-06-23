import Link from "next/link";
import { getHomePageData } from "@/lib/optimized-queries";
import { generateHomeMetadata } from "@/lib/metadata";
import { generateFAQSchema } from "@/lib/schema";
import { safeJsonLdStringify } from "@/lib/utils";
import { Metadata } from "next";
import { HeroVolt } from "@/components/volt/hero-volt";
import { BentoVolt } from "@/components/volt/bento-volt";
import { JobCardVolt, type VoltJob } from "@/components/volt/job-card-volt";
import { getTranslations } from "next-intl/server";
import "@/styles/volt.css";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generateHomeMetadata(locale);
}

async function getHomeFAQ(locale: string) {
  const t = await getTranslations({ locale, namespace: "home.faq" });
  return [
    { question: t("q1"), answer: t("a1") },
    { question: t("q2"), answer: t("a2") },
    { question: t("q3"), answer: t("a3") },
    { question: t("q4"), answer: t("a4") },
  ];
}

function toVoltJob(job: any, idx: number): VoltJob {
  const company =
    typeof job.company === "string"
      ? job.company
      : job.company?.name || job.companyName || "—";
  const tags: string[] =
    (Array.isArray(job.tags) ? job.tags : null) ||
    (Array.isArray(job.skills) ? job.skills : null) ||
    (typeof job.category === "string" ? [job.category] : []);
  const posted = job.publishedAt || job.postedAt || job.createdAt;
  const days = posted
    ? Math.max(
        0,
        Math.floor((Date.now() - new Date(posted).getTime()) / 86400000)
      )
    : idx;
  return {
    id: job.id || job.slug || String(idx),
    title: job.title || "Untitled role",
    company,
    location: job.location || (job.remote ? "Remote" : "—"),
    salaryMin: job.salaryMin ?? undefined,
    salaryMax: job.salaryMax ?? undefined,
    tags: tags.slice(0, 3).map((t) => String(t)),
    match: 70 + ((idx * 13) % 28),
    remote:
      !!job.remote ||
      /remote|远程/i.test(String(job.location || "") + String(job.title || "")),
    postedDays: days,
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  const { featuredJobs, stats } = await getHomePageData();
  const homeFAQ = await getHomeFAQ(locale);

  const displayStats = {
    jobCount: Math.max(stats.jobCount, 1),
    companyCount: Math.max(stats.companyCount, 1),
    dailyNewJobs: Math.max(stats.dailyNewJobs, 0),
  };

  const voltJobs = featuredJobs.slice(0, 6).map((j: any, i: number) =>
    toVoltJob(j, i)
  );

  return (
    <div className="volt-scope">
      <HeroVolt locale={locale} jobCount={displayStats.jobCount} />

      <BentoVolt
        jobCount={displayStats.jobCount}
        companyCount={displayStats.companyCount}
        dailyNewJobs={displayStats.dailyNewJobs}
      />

      {/* Featured jobs */}
      {voltJobs.length > 0 && (
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
                {t("hotJobs")} <span className="volt-serif">·</span>
              </h2>
              <p className="mt-2 text-sm" style={{ color: "var(--fg-dim)" }}>
                {t("hotJobsSub")}
              </p>
            </div>
            <Link
              href={`/${locale}/jobs`}
              className="volt-btn-ghost hidden md:inline-flex text-sm"
            >
              {t("viewAll")} →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {voltJobs.map((j) => (
              <JobCardVolt key={j.id} job={j} locale={locale} />
            ))}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Link href={`/${locale}/jobs`} className="volt-btn">
              {t("viewAllJobs")}
            </Link>
          </div>
        </section>
      )}

      {/* Closing CTA */}
      <section
        className="volt-grain relative mx-auto max-w-7xl overflow-hidden rounded-3xl border px-6 py-24 my-20"
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
            {t("hotJobsSub")}
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href={`/${locale}/jobs`} className="volt-btn">
              {t("viewAllJobs")} <span aria-hidden>→</span>
            </Link>
            <Link href={`/${locale}/about`} className="volt-btn-ghost">
              {t("viewAll")}
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <div className="mb-10">
          <div
            className="font-mono text-xs uppercase tracking-widest"
            style={{ color: "var(--fg-mute)" }}
          >
            03 / Questions
          </div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            {t("faq.title")}
          </h2>
        </div>
        <div className="space-y-3">
          {homeFAQ.map((faq) => (
            <details
              key={faq.question}
              className="volt-card group"
              style={{ padding: 0 }}
            >
              <summary
                className="cursor-pointer list-none px-6 py-5 font-medium flex items-center justify-between"
              >
                <span>{faq.question}</span>
                <span
                  className="volt-serif text-xl transition-transform group-open:rotate-45"
                  style={{ color: "var(--volt)" }}
                >
                  +
                </span>
              </summary>
              <div
                className="px-6 pb-5 text-sm leading-relaxed"
                style={{ color: "var(--fg-dim)" }}
              >
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLdStringify(generateFAQSchema(homeFAQ)),
        }}
      />
    </div>
  );
}
