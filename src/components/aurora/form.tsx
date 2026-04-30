"use client";

import { ButtonHTMLAttributes, forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, useState } from "react";
import { cn } from "@/lib/utils";
import { Loader2, Eye, EyeOff, Check, X } from "lucide-react";

// ============ Input 组件 ============

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, success, icon, rightIcon, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = props.type === "password";
    const inputType = isPassword && showPassword ? "text" : props.type;

    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-gray-700">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={inputType}
            className={cn(
              "w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all",
              icon && "pl-11",
              (isPassword || rightIcon) && "pr-11",
              error && "border-red-300 focus:ring-red-500/20 focus:border-red-500",
              success && "border-emerald-300 focus:ring-emerald-500/20 focus:border-emerald-500",
              className
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
          {rightIcon && !isPassword && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-500 flex items-center gap-1.5">
            <X className="w-3.5 h-3.5" />
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm text-emerald-500 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            {success}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

// ============ Textarea 组件 ============

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        className={cn(
          "w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all resize-none",
          error && "border-red-300 focus:ring-red-500/20 focus:border-red-500",
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1.5">
          <X className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
    </div>
  )
);
Textarea.displayName = "Textarea";

// ============ Select 组件 ============

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={cn(
          "w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all appearance-none cursor-pointer",
          error && "border-red-300 focus:ring-red-500/20 focus:border-red-500",
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1.5">
          <X className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
    </div>
  )
);
Select.displayName = "Select";

// ============ Badge 组件 ============

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info" | "aurora";
  size?: "sm" | "md";
  className?: string;
}

export function Badge({ children, variant = "default", size = "md", className }: BadgeProps) {
  const variants = {
    default: "bg-gray-100 text-gray-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    error: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700",
    aurora: "bg-[#eef2ff] text-[#4f46e5]",
  };

  const sizes = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
  };

  return (
    <span className={cn("inline-flex items-center font-medium rounded-lg", variants[variant], sizes[size], className)}>
      {children}
    </span>
  );
}

// ============ Loading 组件 ============

export function Loading({ text = "加载中..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-[#6366f1] animate-spin mx-auto mb-4" />
        <p className="text-gray-500">{text}</p>
      </div>
    </div>
  );
}

// ============ Empty 组件 ============

export function Empty({ icon, title, description, action }: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center max-w-sm">
        {icon && <div className="w-16 h-16 bg-[#eef2ff] rounded-full flex items-center justify-center mx-auto mb-4">{icon}</div>}
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        {description && <p className="text-gray-500 mb-6">{description}</p>}
        {action}
      </div>
    </div>
  );
}

export { Input, Textarea, Select };
