export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="h-6 w-32 bg-gray-200 rounded mb-6 animate-pulse" />
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="h-8 w-64 bg-gray-200 rounded mb-4 animate-pulse" />
          <div className="h-4 w-40 bg-gray-100 rounded mb-8 animate-pulse" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${80 - i * 5}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
