"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  /** 当前页码（从 1 开始） */
  currentPage: number;
  /** 总页数 */
  totalPages: number;
  /** 基础 URL */
  baseUrl: string;
  /** 附加查询参数 */
  params?: Record<string, string | number | undefined>;
  /** 相邻显示页数 */
  siblingCount?: number;
  className?: string;
}

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/**
 * 分页组件 — 通过 URL 参数驱动翻页，支持 SEO 友好的 Link 跳转
 */
export function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  params = {},
  siblingCount = 1,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const safePage = Math.max(1, Math.min(currentPage, totalPages));

  const buildHref = (page: number) => {
    const searchParams = new URLSearchParams();
    searchParams.set("page", String(page));
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") {
        searchParams.set(key, String(value));
      }
    }
    return `${baseUrl}?${searchParams.toString()}`;
  };

  const pageNumbers: (number | string)[] = [];

  if (totalPages <= 7) {
    pageNumbers.push(...range(1, totalPages));
  } else {
    const leftSibling = safePage - siblingCount;
    const rightSibling = safePage + siblingCount;
    pageNumbers.push(1);
    if (leftSibling > 2) pageNumbers.push("...");
    else if (leftSibling === 2) pageNumbers.push(2);
    const start = Math.max(2, leftSibling);
    const end = Math.min(totalPages - 1, rightSibling);
    pageNumbers.push(...range(start, end));
    if (rightSibling < totalPages - 1) pageNumbers.push("...");
    else if (rightSibling === totalPages - 1) pageNumbers.push(totalPages - 1);
    pageNumbers.push(totalPages);
  }

  return (
    <nav className={cn("flex items-center justify-between", className)}>
      <p className="text-sm text-gray-500">第 {safePage} / {totalPages} 页</p>
      <div className="flex items-center gap-1">
        <Link href={buildHref(1)} className={cn("inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700", safePage === 1 && "pointer-events-none opacity-50")} aria-disabled={safePage === 1} tabIndex={safePage === 1 ? -1 : undefined}><ChevronsLeft className="h-4 w-4" /></Link>
        <Link href={buildHref(safePage - 1)} className={cn("inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700", safePage === 1 && "pointer-events-none opacity-50")} aria-disabled={safePage === 1} tabIndex={safePage === 1 ? -1 : undefined}><ChevronLeft className="h-4 w-4" /></Link>
        {pageNumbers.map((page, i) =>
          typeof page === "string"
            ? <span key={`ellipsis-${i}`} className="h-9 w-9 inline-flex items-center justify-center text-gray-400">…</span>
            : <Link key={page} href={buildHref(page)} className={cn("inline-flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium transition-colors", page === safePage ? "border-blue-600 bg-blue-600 text-white" : "border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900")} aria-current={page === safePage ? "page" : undefined}>{page}</Link>
        )}
        <Link href={buildHref(safePage + 1)} className={cn("inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700", safePage === totalPages && "pointer-events-none opacity-50")} aria-disabled={safePage === totalPages} tabIndex={safePage === totalPages ? -1 : undefined}><ChevronRight className="h-4 w-4" /></Link>
        <Link href={buildHref(totalPages)} className={cn("inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700", safePage === totalPages && "pointer-events-none opacity-50")} aria-disabled={safePage === totalPages} tabIndex={safePage === totalPages ? -1 : undefined}><ChevronsRight className="h-4 w-4" /></Link>
      </div>
    </nav>
  );
}
