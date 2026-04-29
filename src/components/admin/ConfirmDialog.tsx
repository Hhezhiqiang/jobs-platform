"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, X, CheckCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type ConfirmVariant = "success" | "warning" | "error" | "info" | "default";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
}

const variantConfig: Record<ConfirmVariant, {
  icon: typeof AlertTriangle;
  iconColor: string;
  iconBg: string;
  confirmBg: string;
  confirmHover: string;
  confirmText: string;
}> = {
  success: {
    icon: CheckCircle,
    iconColor: "text-green-600",
    iconBg: "bg-green-50",
    confirmBg: "bg-green-600",
    confirmHover: "hover:bg-green-700",
    confirmText: "确认",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-yellow-600",
    iconBg: "bg-yellow-50",
    confirmBg: "bg-yellow-600",
    confirmHover: "hover:bg-yellow-700",
    confirmText: "确认",
  },
  error: {
    icon: AlertTriangle,
    iconColor: "text-red-600",
    iconBg: "bg-red-50",
    confirmBg: "bg-red-600",
    confirmHover: "hover:bg-red-700",
    confirmText: "删除",
  },
  info: {
    icon: Info,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
    confirmBg: "bg-blue-600",
    confirmHover: "hover:bg-blue-700",
    confirmText: "确认",
  },
  default: {
    icon: AlertTriangle,
    iconColor: "text-gray-500",
    iconBg: "bg-gray-50",
    confirmBg: "bg-blue-600",
    confirmHover: "hover:bg-blue-700",
    confirmText: "确认",
  },
};

/**
 * 确认对话框组件 — 通用二次确认弹窗
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText = "取消",
  variant = "default",
  loading = false,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const config = variantConfig[variant];
  const Icon = config.icon;

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleConfirm = async () => {
    await onConfirm();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === dialogRef.current) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", config.iconBg)}>
              <Icon className={cn("h-5 w-5", config.iconColor)} />
            </div>
            <h2 id="confirm-title" className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="关闭"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm leading-relaxed text-gray-600">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              "rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50",
              config.confirmBg,
              config.confirmHover,
            )}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                处理中...
              </span>
            ) : (
              confirmText ?? config.confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
export { ConfirmDialog as default };
