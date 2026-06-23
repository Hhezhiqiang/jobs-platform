"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface Column<T = any> {
  key: string;
  label: string | React.ReactNode;
  className?: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

export interface DataTableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  actions?: (row: T) => React.ReactNode[];
  emptyState?: React.ReactNode;
  selectable?: boolean;
  selectedKeys?: Set<string | number>;
  onSelectionChange?: (keys: Set<string | number>) => void;
  rowKey?: string | ((row: T) => string | number);
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (key: string) => void;
  onRowClick?: (row: T) => void;
  className?: string;
}

/**
 * 可复用数据表格组件 — 支持排序、多选、自定义列渲染、操作列
 */
export function DataTable<T = any>({
  columns,
  data,
  actions,
  emptyState = "暂无数据",
  selectable,
  selectedKeys = new Set(),
  onSelectionChange,
  rowKey = "id",
  sortKey,
  sortDirection,
  onSort,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const [allSelected, setAllSelected] = useState(false);

  const getRowKey = useCallback(
    (row: T): string | number =>
      typeof rowKey === "function" ? rowKey(row) : (row as any)[rowKey],
    [rowKey]
  );

  const handleSelectAll = useCallback(() => {
    const next = !allSelected;
    setAllSelected(next);
    if (onSelectionChange) {
      onSelectionChange(next ? new Set(data.map(getRowKey)) : new Set());
    }
  }, [allSelected, data, getRowKey, onSelectionChange]);

  const handleSelectRow = useCallback(
    (key: string | number) => {
      if (!onSelectionChange) return;
      const next = new Set(selectedKeys);
      next.has(key) ? next.delete(key) : next.add(key);
      onSelectionChange(next);
    },
    [selectedKeys, onSelectionChange]
  );

  const displayColumns = useMemo(() => {
    const cols: Column<T>[] = [...columns];
    if (selectable) {
      cols.unshift({
        key: "_select",
        label: (
          <input
            type="checkbox"
            checked={allSelected}
            onChange={handleSelectAll}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        ),
        className: "w-12",
      });
    }
    if (actions) {
      cols.push({ key: "_actions", label: "操作", className: "w-40 text-right" });
    }
    return cols;
  }, [columns, selectable, actions, allSelected, handleSelectAll]);

  return (
    <div className={cn("overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm", className)}>
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-100 bg-gray-50 text-gray-500">
          <tr>
            {displayColumns.map((col) => (
              <th
                key={col.key}
                className={cn("px-4 py-3 font-medium", col.className)}
              >
                <div className="flex items-center gap-1">
                  {typeof col.label === "string" ? col.label : col.label}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={displayColumns.length} className="px-4 py-12 text-center text-gray-400">
                {emptyState}
              </td>
            </tr>
          ) : (
            data.map((row) => {
              const rk = getRowKey(row);
              return (
                <tr
                  key={rk}
                  className={cn(
                    "border-b border-gray-50 transition-colors last:border-0",
                    onRowClick && "cursor-pointer hover:bg-blue-50/50",
                    selectedKeys.has(rk) && "bg-blue-50"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {displayColumns.map((col) => (
                    <td key={col.key} className={cn("px-4 py-3", col.className)}>
                      {col.key === "_select" ? (
                        <input
                          type="checkbox"
                          checked={selectedKeys.has(rk)}
                          onChange={() => handleSelectRow(rk)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : col.key === "_actions" ? (
                        <div className="flex items-center justify-end gap-2">
                          {actions?.(row).map((action, i) => (
                            <span key={i}>{action}</span>
                          ))}
                        </div>
                      ) : col.render ? (
                        col.render((row as any)[col.key], row)
                      ) : (
                        (row as any)[col.key] ?? "—"
                      )}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
export { DataTable as default };
