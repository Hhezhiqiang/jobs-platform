"use client";

import Link from "next/link";

export interface VoltJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  tags: string[];
  match?: number;
  remote?: boolean;
  postedDays?: number;
}

export function JobCardVolt({
  job,
  locale = "zh",
}: {
  job: VoltJob;
  locale?: string;
}) {
  const salary =
    job.salaryMin && job.salaryMax
      ? `${(job.salaryMin / 1000).toFixed(0)}–${(job.salaryMax / 1000).toFixed(0)}k`
      : "Open";

  return (
    <Link
      href={`/${locale}/jobs/${job.id}`}
      className="volt-card volt-card-glow group block"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div
            className="mb-1 font-mono text-xs uppercase tracking-widest"
            style={{ color: "var(--fg-mute)" }}
          >
            {job.company} · {job.location}
            {job.remote && (
              <span
                className="ml-2 inline-block h-1 w-1 rounded-full align-middle"
                style={{ background: "var(--volt)" }}
              />
            )}
          </div>
          <h3 className="truncate text-xl font-semibold tracking-tight transition-colors group-hover:text-[color:var(--volt)]">
            {job.title}
          </h3>
        </div>
        {typeof job.match === "number" && (
          <div
            className="volt-ring shrink-0"
            style={{ ["--p" as any]: job.match }}
          >
            <div>{job.match}</div>
          </div>
        )}
      </div>

      <div className="mt-5 flex items-end justify-between">
        <div>
          <div
            className="font-mono text-[10px] uppercase tracking-widest"
            style={{ color: "var(--fg-mute)" }}
          >
            Salary
          </div>
          <div className="volt-num text-3xl" style={{ color: "var(--volt)" }}>
            {salary}
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          {job.tags.slice(0, 3).map((t) => (
            <span key={t} className="volt-chip">
              {t}
            </span>
          ))}
        </div>
      </div>

      <div
        className="mt-5 flex items-center justify-between border-t pt-4 text-xs"
        style={{ borderColor: "var(--line)" }}
      >
        <span style={{ color: "var(--fg-mute)" }}>
          {job.postedDays === 0 ? "today" : `${job.postedDays ?? 1}d ago`}
        </span>
        <span
          className="font-mono"
          style={{ color: "var(--fg-dim)" }}
        >
          apply <span aria-hidden>→</span>
        </span>
      </div>
    </Link>
  );
}
