export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-16 bg-white border-b border-gray-200" />
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="h-6 w-40 bg-white/20 rounded mx-auto animate-pulse" />
            <div className="h-12 w-64 bg-white/20 rounded mx-auto animate-pulse" />
            <div className="h-6 w-96 bg-white/20 rounded mx-auto animate-pulse" />
          </div>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-wrap gap-3 mb-12">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-10 w-24 bg-white rounded-xl border border-gray-100 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-100" />
              <div className="p-6 space-y-3">
                <div className="h-5 w-3/4 bg-gray-100 rounded" />
                <div className="h-4 w-full bg-gray-100 rounded" />
                <div className="h-4 w-1/2 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
