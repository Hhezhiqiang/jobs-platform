"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

type ConvSummary = {
  id: string;
  jobId: string | null;
  lastMessageAt: string;
  lastMessageText: string | null;
  unreadByUser: number;
  unreadByCompany: number;
  users: { id: string; name: string; email: string; avatar: string | null };
  companies: { id: string; name: string; logo: string | null; slug: string };
  jobs: { id: string; title: string; slug: string } | null;
};

type Message = {
  id: string;
  senderType: "USER" | "COMPANY";
  senderUserId: string;
  body: string;
  createdAt: string;
};

export default function MessagesPage() {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname() || "/";
  const locale = pathname.startsWith("/en") ? "en" : "zh";
  const search = useSearchParams();
  const initialId = search.get("c");

  const [side, setSide] = useState<"USER" | "COMPANY">("USER");
  const [convs, setConvs] = useState<ConvSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(initialId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [active, setActive] = useState<ConvSummary | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const isEn = locale === "en";

  const loadConvs = useCallback(async () => {
    const r = await fetch("/api/messages", { cache: "no-store" });
    if (!r.ok) return;
    const d = await r.json();
    setSide(d.side || "USER");
    setConvs(d.conversations || []);
    if (!activeId && d.conversations?.[0]?.id) {
      setActiveId(d.conversations[0].id);
    }
  }, [activeId]);

  const loadThread = useCallback(async (id: string) => {
    const r = await fetch(`/api/messages/${id}`, { cache: "no-store" });
    if (!r.ok) return;
    const d = await r.json();
    setActive(d.conversation);
    setMessages(d.messages || []);
    setTimeout(() => {
      if (scrollerRef.current) {
        scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
      }
    }, 50);
  }, []);

  useEffect(() => {
    if (status === "authenticated") loadConvs();
  }, [status, loadConvs]);

  useEffect(() => {
    if (activeId) loadThread(activeId);
  }, [activeId, loadThread]);

  const send = async () => {
    if (!activeId || !text.trim()) return;
    setSending(true);
    try {
      const r = await fetch(`/api/messages/${activeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      if (r.ok) {
        setText("");
        await loadThread(activeId);
        await loadConvs();
      }
    } finally {
      setSending(false);
    }
  };

  if (status === "loading") {
    return <div className="p-10 text-center text-gray-500">{isEn ? "Loading..." : "加载中..."}</div>;
  }
  if (status !== "authenticated") {
    return (
      <div className="p-10 text-center">
        <p className="text-gray-700 mb-3">{isEn ? "Please sign in to view messages." : "请先登录查看消息"}</p>
        <Link
          href={`/${locale}/auth/signin?callbackUrl=/${locale}/messages`}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm"
        >
          {isEn ? "Sign in" : "登录"}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{isEn ? "Messages" : "站内信"}</h1>
          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-mono uppercase tracking-widest">
            {side === "COMPANY" ? (isEn ? "Recruiter inbox" : "招聘方收件箱") : (isEn ? "Candidate inbox" : "求职者收件箱")}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[70vh]">
          {/* Sidebar */}
          <aside className="border-r border-gray-100 overflow-y-auto">
            {convs.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                {isEn ? "No conversations yet." : "还没有任何会话"}
              </div>
            ) : (
              <ul>
                {convs.map((c) => {
                  const unread = side === "COMPANY" ? c.unreadByCompany : c.unreadByUser;
                  const counterpartName = side === "COMPANY" ? c.users?.name : c.companies?.name;
                  const isActive = c.id === activeId;
                  return (
                    <li key={c.id}>
                      <button
                        onClick={() => setActiveId(c.id)}
                        className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-colors ${isActive ? "bg-blue-50" : "hover:bg-gray-50"}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-medium text-sm text-gray-900 truncate">
                              {counterpartName}
                            </div>
                            {c.jobs?.title && (
                              <div className="text-xs text-gray-400 truncate">
                                {c.jobs.title}
                              </div>
                            )}
                            <div className="text-xs text-gray-500 truncate mt-1">
                              {c.lastMessageText || (isEn ? "(no messages yet)" : "（暂无消息）")}
                            </div>
                          </div>
                          {unread > 0 && (
                            <span className="shrink-0 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                              {unread}
                            </span>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          {/* Thread */}
          <section className="flex flex-col">
            {!active ? (
              <div className="flex-1 grid place-items-center text-gray-400 text-sm">
                {isEn ? "Select a conversation." : "选择一个会话开始查看"}
              </div>
            ) : (
              <>
                <header className="px-5 py-3 border-b border-gray-100">
                  <div className="font-semibold text-gray-900">
                    {side === "COMPANY" ? active.users?.name : active.companies?.name}
                  </div>
                  {active.jobs?.title && (
                    <div className="text-xs text-gray-400">{active.jobs.title}</div>
                  )}
                </header>
                <div ref={scrollerRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center text-sm text-gray-400 py-8">
                      {isEn ? "Say hello — break the ice." : "发条消息，打个招呼"}
                    </div>
                  ) : (
                    messages.map((m) => {
                      const mineSide = side;
                      const isMine = m.senderType === mineSide;
                      return (
                        <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[78%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap break-words ${
                              isMine
                                ? "bg-blue-600 text-white rounded-br-sm"
                                : "bg-gray-100 text-gray-900 rounded-bl-sm"
                            }`}
                          >
                            {m.body}
                            <div className={`mt-1 text-[10px] ${isMine ? "text-blue-100" : "text-gray-400"}`}>
                              {new Date(m.createdAt).toLocaleString(isEn ? "en-US" : "zh-CN")}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!sending) send();
                  }}
                  className="border-t border-gray-100 p-3 flex gap-2"
                >
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={2}
                    placeholder={isEn ? "Type a message..." : "输入消息..."}
                    className="flex-1 resize-none px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        if (!sending) send();
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={sending || !text.trim()}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:opacity-50"
                  >
                    {sending ? (isEn ? "Sending..." : "发送中...") : isEn ? "Send" : "发送"}
                  </button>
                </form>
              </>
            )}
          </section>
        </div>

        <p className="mt-4 text-xs text-gray-400">
          {isEn
            ? "Tip: press ⌘/Ctrl + Enter to send."
            : "提示：按 ⌘/Ctrl + Enter 快速发送。"}
        </p>
      </div>
    </div>
  );
}
