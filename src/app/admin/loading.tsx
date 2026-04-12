export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-16 bg-gray-200 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-28 bg-gray-200 rounded-xl" />
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
