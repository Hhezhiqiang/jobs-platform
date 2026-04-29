export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-20">
          <div className="text-center">
            <div className="h-8 w-48 bg-white/20 rounded-full mx-auto mb-6 animate-pulse" />
            <div className="h-12 w-64 bg-white/20 rounded mx-auto mb-4 animate-pulse" />
            <div className="h-6 w-96 bg-white/10 rounded mx-auto animate-pulse" />
          </div>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-48 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            ))}
          </div>
          <div className="space-y-6">
            <div className="h-40 bg-white rounded-2xl shadow-sm animate-pulse" />
            <div className="h-64 bg-white rounded-2xl shadow-sm animate-pulse" />
          </div>
        </div>
      </main>
    </div>
  );
}
