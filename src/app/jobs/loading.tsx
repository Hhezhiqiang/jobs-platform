export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-16 bg-white border-b border-gray-200" />
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="h-6 w-32 bg-gray-200 rounded mb-3 animate-pulse" />
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 h-96 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          <div className="lg:col-span-3 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-32 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
