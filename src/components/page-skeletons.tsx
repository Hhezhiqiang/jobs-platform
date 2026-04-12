export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-4xl px-4 space-y-6">
        <div className="h-8 w-1/3 mx-auto bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-24 rounded-xl bg-gray-200 animate-pulse" />
          <div className="h-24 rounded-xl bg-gray-200 animate-pulse" />
          <div className="h-24 rounded-xl bg-gray-200 animate-pulse" />
        </div>
        <div className="h-64 rounded-xl bg-gray-200 animate-pulse" />
      </div>
    </div>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-20 rounded-xl bg-gray-200 animate-pulse" />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="h-10 w-full bg-gray-200 animate-pulse" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 w-full bg-gray-200 animate-pulse" />
      ))}
    </div>
  );
}
