export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="bg-white rounded-2xl h-48">
            <div className="h-full bg-gray-200 rounded-2xl" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-32 bg-gray-200 rounded-xl" />
              <div className="h-32 bg-gray-200 rounded-xl" />
              <div className="h-32 bg-gray-200 rounded-xl" />
            </div>
            <div className="space-y-4">
              <div className="h-64 bg-gray-200 rounded-xl" />
              <div className="h-48 bg-gray-200 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
