"use client";

import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";

export function TelegramFloatButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 悬浮按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#0088cc] hover:bg-[#0077b3] rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
        aria-label="联系客服"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>

      {/* 弹窗 */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* 头部 */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4">
            <h3 className="text-white font-bold text-lg">联系我们</h3>
            <p className="text-blue-100 text-sm">有任何问题？我们随时为您解答</p>
          </div>

          {/* 选项 */}
          <div className="p-4 space-y-3">
            <a
              href="https://t.me/Web3Kairo"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl bg-[#0088cc]/10 hover:bg-[#0088cc]/20 transition-colors group"
            >
              <div className="w-10 h-10 bg-[#0088cc] rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Telegram 官方频道</p>
                <p className="text-sm text-gray-500">加入我们的社区</p>
              </div>
              <Send className="w-5 h-5 text-gray-400 group-hover:text-[#0088cc] transition-colors" />
            </a>

            <a
              href="mailto:support@jobs-platform.com"
              className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
            >
              <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">邮件联系</p>
                <p className="text-sm text-gray-500">support@jobs-platform.com</p>
              </div>
            </a>
          </div>

          {/* 底部 */}
          <div className="px-4 pb-4">
            <p className="text-xs text-gray-400 text-center">
              平均响应时间: 24小时内
            </p>
          </div>
        </div>
      )}
    </>
  );
}
