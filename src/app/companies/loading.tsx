export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-16 bg-white border-b border-gray-200" />
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto space-y-4 text-center">
            <div className="h-6 w-32 bg-white/20 rounded mx-auto animate-pulse" />
            <div className="h-10 w-48 bg-white/20 rounded mx-auto animate-pulse" />
            <div className="h-5 w-72 bg-white/20 rounded mx-auto animate-pulse" />
          </div>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="h-6 w-40 bg-white rounded-lg border border-gray-100 animate-pulse mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-3/4 bg-gray-100 rounded" />
                  <div className="h-4 w-1/2 bg-gray-100 rounded" />
                  <div className="h-4 w-2/3 bg-gray-100 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
