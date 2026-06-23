"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { logger } from "@/lib/logger";

type Category = "PARTNER" | "PROJECT" | "SKILL" | "OTHER";

interface Author {
  id: string;
  name: string;
  avatar: string | null;
  email?: string;
}

interface Post {
  id: string;
  content: string;
  category: Category;
  commentCount: number;
  createdAt: string;
  author: Author;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: Author;
}

const CAT_LABELS: Record<string, { zh: string; en: string; color: string }> = {
  PARTNER: { zh: "找合伙人", en: "Co-founder", color: "#B6FF3D" },
  PROJECT: { zh: "项目协作", en: "Project", color: "#7CC4FF" },
  SKILL: { zh: "技能交换", en: "Skill swap", color: "#FFB86B" },
  OTHER: { zh: "其他", en: "Other", color: "rgba(245,245,245,0.55)" },
};

function timeAgo(iso: string, isEn: boolean) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return isEn ? "just now" : "刚刚";
  if (m < 60) return isEn ? `${m}m ago` : `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return isEn ? `${h}h ago` : `${h} 小时前`;
  const d = Math.floor(h / 24);
  if (d < 30) return isEn ? `${d}d ago` : `${d} 天前`;
  return new Date(iso).toLocaleDateString(isEn ? "en-US" : "zh-CN");
}

export default function CirclesClient() {
  const pathname = usePathname() || "/";
  const locale = pathname.startsWith("/en") ? "en" : "zh";
  const isEn = locale === "en";
  const { data: session, status } = useSession();
  const myId = session?.user?.id || null;

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Category | "ALL">("ALL");
  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftCat, setDraftCat] = useState<Category>("PARTNER");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const url =
        filter === "ALL"
          ? "/api/circles/posts?page=1&limit=30"
          : `/api/circles/posts?page=1&limit=30&category=${filter}`;
      const r = await fetch(url, { cache: "no-store" });
      if (r.ok) {
        const d = await r.json();
        setPosts(d.posts || []);
      }
    } catch (e) {
      logger.error("Load circle posts:", e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const submitPost = async () => {
    setError("");
    const content = draft.trim();
    if (content.length < 2) {
      setError(isEn ? "Content too short" : "内容太短");
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/circles/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, category: draftCat }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || (isEn ? "Failed" : "发帖失败"));
        return;
      }
      setDraft("");
      setComposerOpen(false);
      // Prepend new post
      setPosts((prev) => [d.post, ...prev]);
    } finally {
      setSubmitting(false);
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm(isEn ? "Delete this post?" : "确定删除这条帖子？")) return;
    const r = await fetch(`/api/circles/posts/${id}`, { method: "DELETE" });
    if (r.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const filterChips: { v: Category | "ALL"; label: string }[] = [
    { v: "ALL", label: isEn ? "All" : "全部" },
    { v: "PARTNER", label: isEn ? CAT_LABELS.PARTNER.en : CAT_LABELS.PARTNER.zh },
    { v: "PROJECT", label: isEn ? CAT_LABELS.PROJECT.en : CAT_LABELS.PROJECT.zh },
    { v: "SKILL", label: isEn ? CAT_LABELS.SKILL.en : CAT_LABELS.SKILL.zh },
    { v: "OTHER", label: isEn ? CAT_LABELS.OTHER.en : CAT_LABELS.OTHER.zh },
  ];

  return (
    <main
      style={{ background: "#0a0a0a", color: "#f5f5f5" }}
      className="min-h-screen pb-24"
    >
      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 pt-12 pb-6 md:pt-16">
        <div
          className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-mono uppercase tracking-widest"
          style={{
            borderColor: "rgba(255,255,255,0.14)",
            color: "rgba(245,245,245,0.62)",
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#B6FF3D" }} />
          {isEn ? "Circles · public board" : "圈子 · 合作机会留言板"}
        </div>
        <h1 className="mt-5 text-3xl md:text-5xl font-semibold leading-tight tracking-tight">
          {isEn ? (
            <>
              Find your next <span style={{ color: "#B6FF3D" }}>collaborator</span>
            </>
          ) : (
            <>
              发帖找到你的 <span style={{ color: "#B6FF3D" }}>下一个合伙人</span>
            </>
          )}
        </h1>
        <p
          className="mt-3 text-sm md:text-base"
          style={{ color: "rgba(245,245,245,0.66)" }}
        >
          {isEn
            ? "Share what you're building, what you're looking for. Reply to anyone who fits — or email them directly."
            : "说说你在做什么、想找什么样的伙伴。看到合适的，公开回复或直接邮件联系。"}
        </p>
      </section>

      {/* Composer */}
      <section className="mx-auto max-w-3xl px-6">
        {status === "authenticated" ? (
          <div
            className="rounded-2xl border p-4"
            style={{ background: "#111111", borderColor: "rgba(255,255,255,0.08)" }}
          >
            {!composerOpen ? (
              <button
                onClick={() => setComposerOpen(true)}
                className="w-full text-left text-sm py-2 px-3 rounded-lg"
                style={{
                  color: "rgba(245,245,245,0.55)",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                {isEn ? "Share an opportunity..." : "发条帖子，找合作机会..."}
              </button>
            ) : (
              <div className="space-y-3">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={
                    isEn
                      ? "What are you working on / looking for? (2-500 chars)"
                      : "你在做什么、想找什么人？(2-500 字)"
                  }
                  rows={4}
                  maxLength={500}
                  className="w-full rounded-lg px-3 py-2 text-sm bg-transparent border focus:outline-none"
                  style={{
                    borderColor: "rgba(255,255,255,0.14)",
                    color: "#f5f5f5",
                  }}
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-2">
                    {(["PARTNER", "PROJECT", "SKILL", "OTHER"] as Category[]).map((c) => (
                      <button
                        key={c}
                        onClick={() => setDraftCat(c)}
                        className="text-xs font-mono uppercase tracking-wider rounded-full px-3 py-1 border"
                        style={{
                          borderColor:
                            draftCat === c
                              ? CAT_LABELS[c].color
                              : "rgba(255,255,255,0.14)",
                          color:
                            draftCat === c
                              ? CAT_LABELS[c].color
                              : "rgba(245,245,245,0.55)",
                          background:
                            draftCat === c ? "rgba(182,255,61,0.06)" : "transparent",
                        }}
                      >
                        {isEn ? CAT_LABELS[c].en : CAT_LABELS[c].zh}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: "rgba(245,245,245,0.4)" }}>
                      {draft.length}/500
                    </span>
                    <button
                      onClick={() => {
                        setComposerOpen(false);
                        setDraft("");
                        setError("");
                      }}
                      className="text-xs px-3 py-1.5 rounded-full"
                      style={{ color: "rgba(245,245,245,0.6)" }}
                    >
                      {isEn ? "Cancel" : "取消"}
                    </button>
                    <button
                      onClick={submitPost}
                      disabled={submitting || draft.trim().length < 2}
                      className="text-xs font-semibold px-4 py-1.5 rounded-full disabled:opacity-40"
                      style={{ background: "#B6FF3D", color: "#0a0a0a" }}
                    >
                      {submitting
                        ? isEn
                          ? "Posting..."
                          : "发布中..."
                        : isEn
                          ? "Post"
                          : "发布"}
                    </button>
                  </div>
                </div>
                {error && (
                  <div className="text-xs" style={{ color: "#ff5a36" }}>
                    {error}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div
            className="rounded-2xl border p-4 flex items-center justify-between"
            style={{ background: "#111111", borderColor: "rgba(255,255,255,0.08)" }}
          >
            <span className="text-sm" style={{ color: "rgba(245,245,245,0.6)" }}>
              {isEn ? "Sign in to post and reply." : "登录后才能发帖和评论"}
            </span>
            <Link
              href={`/${locale}/auth/login?callbackUrl=/${locale}/circles`}
              className="text-xs font-semibold rounded-full px-4 py-1.5"
              style={{ background: "#B6FF3D", color: "#0a0a0a" }}
            >
              {isEn ? "Sign in →" : "登录 →"}
            </Link>
          </div>
        )}
      </section>

      {/* Filter chips */}
      <section className="mx-auto max-w-3xl px-6 mt-6">
        <div className="flex flex-wrap gap-2">
          {filterChips.map((c) => (
            <button
              key={c.v}
              onClick={() => setFilter(c.v)}
              className="text-xs font-mono uppercase tracking-wider rounded-full px-3 py-1 border"
              style={{
                borderColor:
                  filter === c.v ? "#B6FF3D" : "rgba(255,255,255,0.14)",
                color:
                  filter === c.v ? "#B6FF3D" : "rgba(245,245,245,0.55)",
                background:
                  filter === c.v ? "rgba(182,255,61,0.06)" : "transparent",
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      {/* Feed */}
      <section className="mx-auto max-w-3xl px-6 mt-6 space-y-3">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border p-5 animate-pulse"
              style={{ background: "#111111", borderColor: "rgba(255,255,255,0.08)" }}
            >
              <div className="h-3 w-1/3 mb-3 rounded" style={{ background: "rgba(255,255,255,0.08)" }} />
              <div className="h-4 w-full mb-2 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
              <div className="h-4 w-2/3 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
            </div>
          ))
        ) : posts.length === 0 ? (
          <div
            className="rounded-2xl border p-12 text-center text-sm"
            style={{
              background: "#111111",
              borderColor: "rgba(255,255,255,0.08)",
              color: "rgba(245,245,245,0.5)",
            }}
          >
            {isEn ? "No posts yet — be the first." : "还没有帖子，发出第一条吧"}
          </div>
        ) : (
          posts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              isEn={isEn}
              locale={locale}
              myId={myId}
              expanded={expanded === p.id}
              onToggleExpand={() => setExpanded(expanded === p.id ? null : p.id)}
              onDelete={() => deletePost(p.id)}
              onCommentAdded={() =>
                setPosts((prev) =>
                  prev.map((x) =>
                    x.id === p.id ? { ...x, commentCount: x.commentCount + 1 } : x
                  )
                )
              }
            />
          ))
        )}
      </section>
    </main>
  );
}

function PostCard({
  post,
  isEn,
  locale,
  myId,
  expanded,
  onToggleExpand,
  onDelete,
  onCommentAdded,
}: {
  post: Post;
  isEn: boolean;
  locale: string;
  myId: string | null;
  expanded: boolean;
  onToggleExpand: () => void;
  onDelete: () => void;
  onCommentAdded: () => void;
}) {
  const cat = CAT_LABELS[post.category] || CAT_LABELS.OTHER;
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const isMine = myId === post.author.id;

  useEffect(() => {
    if (!expanded) return;
    setLoadingComments(true);
    fetch(`/api/circles/posts/${post.id}/comments`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setComments(d.comments || []))
      .finally(() => setLoadingComments(false));
  }, [expanded, post.id]);

  const send = async () => {
    const content = reply.trim();
    if (content.length < 1) return;
    setSending(true);
    try {
      const r = await fetch(`/api/circles/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (r.ok) {
        const d = await r.json();
        setComments((prev) => [...prev, d.comment]);
        setReply("");
        onCommentAdded();
      } else if (r.status === 401) {
        window.location.href = `/${locale}/auth/login?callbackUrl=/${locale}/circles`;
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <article
      className="rounded-2xl border p-5"
      style={{ background: "#111111", borderColor: "rgba(255,255,255,0.08)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {post.author.avatar ? (
            <Image
              src={post.author.avatar}
              alt={post.author.name}
              width={36}
              height={36}
              className="rounded-full"
            />
          ) : (
            <div
              className="h-9 w-9 rounded-full grid place-items-center text-sm font-bold flex-shrink-0"
              style={{ background: "#B6FF3D", color: "#0a0a0a" }}
            >
              {post.author.name?.slice(0, 1).toUpperCase() || "?"}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-sm font-medium truncate" style={{ color: "#f5f5f5" }}>
              {post.author.name}
            </div>
            <div className="text-xs" style={{ color: "rgba(245,245,245,0.4)" }}>
              {timeAgo(post.createdAt, isEn)}
            </div>
          </div>
        </div>
        <span
          className="text-xs font-mono uppercase tracking-wider rounded-full px-2.5 py-0.5 border flex-shrink-0"
          style={{ borderColor: cat.color, color: cat.color }}
        >
          {isEn ? cat.en : cat.zh}
        </span>
      </div>

      {/* Content */}
      <p
        className="mt-3 text-sm md:text-base whitespace-pre-wrap break-words"
        style={{ color: "rgba(245,245,245,0.88)" }}
      >
        {post.content}
      </p>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <button
          onClick={onToggleExpand}
          className="text-xs px-3 py-1.5 rounded-full"
          style={{
            color: "rgba(245,245,245,0.75)",
            background: "rgba(255,255,255,0.04)",
          }}
        >
          💬 {post.commentCount} {isEn ? "replies" : "评论"}
        </button>
        {post.author.email && !isMine && (
          <a
            href={`mailto:${post.author.email}?subject=${encodeURIComponent(
              isEn ? "Re: your circle post on JobQuip" : "回复你在 JobQuip 圈子的帖子"
            )}`}
            className="text-xs px-3 py-1.5 rounded-full"
            style={{
              color: "#0a0a0a",
              background: "#B6FF3D",
              fontWeight: 600,
            }}
          >
            {isEn ? "✉ Email author" : "✉ 邮件联系 TA"}
          </a>
        )}
        {isMine && (
          <button
            onClick={onDelete}
            className="text-xs px-3 py-1.5 rounded-full ml-auto"
            style={{ color: "#ff5a36" }}
          >
            {isEn ? "Delete" : "删除"}
          </button>
        )}
      </div>

      {/* Comments */}
      {expanded && (
        <div className="mt-4 pt-4 border-t space-y-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          {loadingComments ? (
            <div className="text-xs" style={{ color: "rgba(245,245,245,0.4)" }}>
              {isEn ? "Loading..." : "加载中..."}
            </div>
          ) : comments.length === 0 ? (
            <div className="text-xs" style={{ color: "rgba(245,245,245,0.4)" }}>
              {isEn ? "No replies yet." : "还没有评论，留下第一条"}
            </div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex items-start gap-2.5">
                {c.author.avatar ? (
                  <Image
                    src={c.author.avatar}
                    alt={c.author.name}
                    width={28}
                    height={28}
                    className="rounded-full flex-shrink-0"
                  />
                ) : (
                  <div
                    className="h-7 w-7 rounded-full grid place-items-center text-[10px] font-bold flex-shrink-0"
                    style={{ background: "rgba(245,245,245,0.1)", color: "#f5f5f5" }}
                  >
                    {c.author.name?.slice(0, 1).toUpperCase() || "?"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs" style={{ color: "rgba(245,245,245,0.55)" }}>
                    <span className="font-medium" style={{ color: "#f5f5f5" }}>
                      {c.author.name}
                    </span>{" "}
                    · {timeAgo(c.createdAt, isEn)}
                  </div>
                  <div
                    className="text-sm mt-0.5 whitespace-pre-wrap break-words"
                    style={{ color: "rgba(245,245,245,0.85)" }}
                  >
                    {c.content}
                  </div>
                </div>
              </div>
            ))
          )}

          {myId ? (
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder={isEn ? "Reply..." : "回复..."}
                maxLength={300}
                className="flex-1 rounded-full px-4 py-1.5 text-sm bg-transparent border focus:outline-none"
                style={{
                  borderColor: "rgba(255,255,255,0.14)",
                  color: "#f5f5f5",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !sending) send();
                }}
              />
              <button
                onClick={send}
                disabled={sending || reply.trim().length < 1}
                className="text-xs font-semibold px-4 py-1.5 rounded-full disabled:opacity-40"
                style={{ background: "#B6FF3D", color: "#0a0a0a" }}
              >
                {sending ? (isEn ? "..." : "...") : isEn ? "Send" : "发送"}
              </button>
            </div>
          ) : (
            <Link
              href={`/${locale}/auth/login?callbackUrl=/${locale}/circles`}
              className="text-xs inline-block"
              style={{ color: "#B6FF3D" }}
            >
              {isEn ? "Sign in to reply →" : "登录后回复 →"}
            </Link>
          )}
        </div>
      )}
    </article>
  );
}
