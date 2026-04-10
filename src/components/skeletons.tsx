"use client";

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export function JobCardSkeleton({ variant = "default" }: { variant?: "default" | "compact" | "featured" }) {
  if (variant === "compact") {
    return (
      <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100">
        <Skeleton circle width={48} height={48} />
        <div className="flex-1">
          <Skeleton width={150} height={20} />
          <Skeleton width={100} height={14} style={{ marginTop: 8 }} />
          <div className="flex gap-2 mt-2">
            <Skeleton width={60} height={12} />
            <Skeleton width={40} height={12} />
          </div>
        </div>
        <div className="text-right">
          <Skeleton width={60} height={20} />
          <Skeleton width={40} height={12} style={{ marginTop: 4 }} />
        </div>
      </div>
    );
  }

  if (variant === "featured") {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <Skeleton height={160} />
        <div className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <Skeleton circle width={40} height={40} />
            <div>
              <Skeleton width={120} height={18} />
              <Skeleton width={80} height={12} style={{ marginTop: 4 }} />
            </div>
          </div>
          <Skeleton width={200} height={24} style={{ marginBottom: 12 }} />
          <div className="flex gap-2 mb-4">
            <Skeleton width={60} height={24} borderRadius={8} />
            <Skeleton width={80} height={24} borderRadius={8} />
          </div>
          <div className="flex justify-between pt-4 border-t border-gray-100">
            <Skeleton width={80} height={24} />
            <Skeleton width={60} height={16} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-start gap-4">
        <Skeleton circle width={56} height={56} />
        <div className="flex-1">
          <div className="flex justify-between">
            <div>
              <Skeleton width={180} height={22} />
              <Skeleton width={120} height={16} style={{ marginTop: 4 }} />
            </div>
            <Skeleton width={70} height={24} />
          </div>
          <div className="flex gap-2 mt-3">
            <Skeleton width={80} height={28} borderRadius={8} />
            <Skeleton width={100} height={28} borderRadius={8} />
          </div>
          <div className="flex justify-between mt-4 pt-4 border-t border-gray-50">
            <Skeleton width={100} height={16} />
            <Skeleton width={80} height={16} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CompanyCardSkeleton() {
  return (
    <div className="flex items-center gap-3 px-6 py-4 bg-white rounded-xl border border-gray-100">
      <Skeleton circle width={48} height={48} />
      <div>
        <Skeleton width={120} height={18} />
        <Skeleton width={80} height={14} style={{ marginTop: 4 }} />
      </div>
    </div>
  );
}

export function BlogCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <Skeleton height={200} />
      <div className="p-5">
        <div className="flex gap-2 mb-3">
          <Skeleton width={60} height={20} borderRadius={4} />
          <Skeleton width={40} height={20} borderRadius={4} />
        </div>
        <Skeleton width="100%" height={24} style={{ marginBottom: 8 }} />
        <Skeleton width="80%" height={16} style={{ marginBottom: 16 }} />
        <div className="flex items-center gap-3">
          <Skeleton circle width={32} height={32} />
          <div>
            <Skeleton width={80} height={14} />
            <Skeleton width={60} height={12} style={{ marginTop: 2 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function JobsListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <JobCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function CompaniesListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CompanyCardSkeleton key={i} />
      ))}
    </div>
  );
}
