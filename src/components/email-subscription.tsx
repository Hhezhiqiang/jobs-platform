"use client";

import { useState } from "react";
import { Mail, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { subscribeEmail } from "@/lib/email-subscription";

export function EmailSubscription() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) return;
    
    setStatus("loading");
    
    const result = await subscribeEmail(email);
    
    setStatus(result.success ? "success" : "error");
    setMessage(result.message);
    
    if (result.success) {
      setEmail("");
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
          <Mail className="w-5 h-5" />
        </div>
        <h3 className="text-xl font-bold">订阅最新文章</h3>
      </div>
      
      <p className="text-white/80 mb-4 text-sm">
        订阅我们的邮件，第一时间获取求职干货、面试技巧和行业动态
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="输入您的邮箱"
            className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
            required
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
          >
            {status === "loading" ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "订阅"
            )}
          </button>
        </div>
        
        {status === "success" && (
          <div className="flex items-center gap-2 text-green-300 text-sm">
            <CheckCircle className="w-4 h-4" />
            {message}
          </div>
        )}
        
        {status === "error" && (
          <div className="flex items-center gap-2 text-red-300 text-sm">
            <AlertCircle className="w-4 h-4" />
            {message}
          </div>
        )}
      </form>
      
      <p className="text-white/60 text-xs mt-3">
        我们尊重您的隐私，随时可以取消订阅
      </p>
    </div>
  );
}
