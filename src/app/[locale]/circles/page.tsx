import { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  return {
    title: isEn
      ? "Circles — Recommend roles to people in your network | JobQuip"
      : "圈子 — 把好职位推荐给同行 | JobQuip",
    description: isEn
      ? "JobQuip Circles lets you privately recommend open roles to job seekers in your network — and discover roles recommended by people you trust."
      : "JobQuip 圈子让你把开放职位精准推荐给身边在求职的朋友，也能收到信任的人推给你的好机会。",
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com"}/${locale}/circles`,
    },
    robots: { index: true, follow: true },
  };
}

const COPY = {
  zh: {
    eyebrow: "内测中 · Early Access",
    headline: ["精准推荐", "藏在朋友圈的好工作"],
    sub: "把一个职位 1:1 推给圈内正在找工作的朋友，对方收到时附带你的留言。比群发链接体面，比内推快十倍。",
    cta1: "申请加入圈子",
    cta2: "浏览职位 →",
    statRoles: "正在等推荐的职位",
    statSeekers: "圈内求职者",
    statHit: "首推命中率",
    featureTitle: "圈子能做什么",
    features: [
      {
        title: "1:1 私密推荐",
        desc: "选一个职位，选一个朋友，附带一句话理由。对方在「我的 / 圈子推荐」里能直接看到。",
      },
      {
        title: "求职状态可见",
        desc: "只把推荐发给「正在看机会」的人。圈外人、关闭求职的人收不到打扰。",
      },
      {
        title: "对方决定要不要回",
        desc: "推荐不是骚扰：对方可以 thanks、可以申请、可以静默忽略，你都能看到状态。",
      },
      {
        title: "招聘方可用",
        desc: "雇主侧也能批量给目标候选人发定向推荐，比邮件 cold reach 接受率高得多。",
      },
    ],
    howTitle: "怎么用",
    how: [
      "在职位页点「推荐给朋友」",
      "从你的圈子里挑一个正在找工作的人",
      "写一句你为什么觉得他/她合适",
      "对方收到推荐，决定回应、申请或忽略",
    ],
    waitlist: "圈子目前面向认证用户灰度开放。点上面的按钮加入名单，开放后第一时间通知。",
  },
  en: {
    eyebrow: "Closed beta · Early access",
    headline: ["Quietly forward", "the right role"],
    sub: "Recommend one open role to one person in your network with a short note. Classier than spamming a group chat, faster than a referral form.",
    cta1: "Request access",
    cta2: "Browse open roles →",
    statRoles: "Open roles awaiting a forward",
    statSeekers: "Active seekers in your reach",
    statHit: "First-shot match rate",
    featureTitle: "What Circles is for",
    features: [
      {
        title: "1:1 private forward",
        desc: "Pick a role, pick one friend, add a one-liner. They see it under My / Recommended for you.",
      },
      {
        title: "Status-aware",
        desc: "Only people who flipped on Looking get forwards. Closed-status contacts stay off-radar.",
      },
      {
        title: "Opt-in by design",
        desc: "They can thank, apply, or quietly ignore. You see the state — no read receipts ambiguity.",
      },
      {
        title: "Employers welcome",
        desc: "Hiring teams can batch-forward to shortlisted candidates. Higher response than cold email.",
      },
    ],
    howTitle: "How it works",
    how: [
      "Hit Recommend on any role",
      "Pick a person in your circle who's looking",
      "Write one line on why they fit",
      "They reply, apply, or ignore — your call to follow up",
    ],
    waitlist:
      "Circles is rolling out to verified users in waves. Tap above to join the list; we ping you the day it opens.",
  },
} as const;

export default async function CirclesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEn = locale === "en";
  const t = isEn ? COPY.en : COPY.zh;

  return (
    <main
      style={{ background: "#0a0a0a", color: "#f5f5f5" }}
      className="min-h-screen pb-32 md:pb-24"
    >
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-12 md:pt-24 md:pb-16">
        <div
          className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-mono uppercase tracking-widest"
          style={{
            borderColor: "rgba(255,255,255,0.14)",
            color: "rgba(245,245,245,0.62)",
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: "#B6FF3D" }}
          />
          {t.eyebrow}
        </div>
        <h1 className="mt-6 text-5xl md:text-7xl font-semibold leading-[1.05] tracking-tight">
          <span style={{ color: "#f5f5f5" }}>{t.headline[0]}</span>
          <br />
          <span
            style={{
              fontFamily: "var(--font-instrument-serif, serif)",
              fontStyle: "italic",
              color: "#B6FF3D",
            }}
          >
            {t.headline[1]}
          </span>
        </h1>
        <p
          className="mt-6 max-w-2xl text-base md:text-lg leading-relaxed"
          style={{ color: "rgba(245,245,245,0.72)" }}
        >
          {t.sub}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href={`/${locale}/auth/login?callbackUrl=/${locale}/circles`}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
            style={{ background: "#B6FF3D", color: "#0a0a0a" }}
          >
            {t.cta1} <span aria-hidden>→</span>
          </Link>
          <Link
            href={`/${locale}/jobs`}
            className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm"
            style={{
              borderColor: "rgba(255,255,255,0.14)",
              color: "rgba(245,245,245,0.85)",
            }}
          >
            {t.cta2}
          </Link>
        </div>

        {/* Stats strip */}
        <div
          className="mt-12 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border"
          style={{
            background: "rgba(255,255,255,0.06)",
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          {[
            { v: "120+", k: t.statRoles },
            { v: "640", k: t.statSeekers },
            { v: "38%", k: t.statHit },
          ].map((s) => (
            <div
              key={s.k}
              className="px-5 py-6 md:px-7 md:py-8"
              style={{ background: "#111111" }}
            >
              <div
                className="text-3xl md:text-4xl font-semibold tracking-tight"
                style={{ color: "#B6FF3D" }}
              >
                {s.v}
              </div>
              <div
                className="mt-2 text-xs md:text-sm font-mono uppercase tracking-widest"
                style={{ color: "rgba(245,245,245,0.55)" }}
              >
                {s.k}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-10 md:py-16">
        <h2
          className="text-xs font-mono uppercase tracking-widest"
          style={{ color: "rgba(245,245,245,0.50)" }}
        >
          {t.featureTitle}
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {t.features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border p-6 md:p-7"
              style={{
                background: "#111111",
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <h3 className="text-lg md:text-xl font-semibold tracking-tight">
                {f.title}
              </h3>
              <p
                className="mt-3 text-sm md:text-base leading-relaxed"
                style={{ color: "rgba(245,245,245,0.68)" }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How */}
      <section className="mx-auto max-w-6xl px-6 py-10 md:py-16">
        <h2
          className="text-xs font-mono uppercase tracking-widest"
          style={{ color: "rgba(245,245,245,0.50)" }}
        >
          {t.howTitle}
        </h2>
        <ol className="mt-6 grid gap-3 md:grid-cols-4">
          {t.how.map((step, i) => (
            <li
              key={i}
              className="rounded-2xl border p-5"
              style={{
                background: "#111111",
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <div
                className="text-xs font-mono uppercase tracking-widest"
                style={{ color: "#B6FF3D" }}
              >
                STEP {String(i + 1).padStart(2, "0")}
              </div>
              <p
                className="mt-3 text-sm leading-relaxed"
                style={{ color: "rgba(245,245,245,0.82)" }}
              >
                {step}
              </p>
            </li>
          ))}
        </ol>

        <p
          className="mt-10 max-w-2xl text-sm leading-relaxed"
          style={{ color: "rgba(245,245,245,0.55)" }}
        >
          {t.waitlist}
        </p>
      </section>
    </main>
  );
}
