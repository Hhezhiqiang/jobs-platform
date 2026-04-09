import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "关于我们 - 招聘平台",
  description: "了解招聘平台的使命、愿景和团队",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              ← 返回首页
            </Link>
            <h1 className="text-2xl font-bold">关于我们</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">关于招聘平台</h2>
            <p className="text-gray-700 leading-relaxed">
              招聘平台是一个专业的求职招聘服务平台，致力于连接优秀人才与顶尖企业。
              我们提供全面的职位信息、便捷的企业展示和高效的招聘管理工具。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">我们的使命</h2>
            <p className="text-gray-700 leading-relaxed">
              让求职更简单，让招聘更高效。我们通过技术创新和优质服务，
              为求职者和企业搭建沟通的桥梁，促进人才资源的合理配置。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">联系我们</h2>
            <div className="space-y-2 text-gray-700">
              <p>📧 邮箱：contact@example.com</p>
              <p>📍 地址：北京市朝阳区</p>
              <p>📞 电话：400-123-4567</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
