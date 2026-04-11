export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">页面未找到</p>
        <a href="/" className="text-blue-600 hover:text-blue-700 font-medium">
          ← 返回首页
        </a>
      </div>
    </div>
  );
}
