import { Metadata } from "next";

export const metadata: Metadata = {
  title: "隐私政策 - JobQuip招聘平台 | 用户信息保护说明",
  description: "了解JobQuip招聘平台如何收集、使用和保护您的个人信息。我们采用银行级加密技术，严格保护用户隐私，确保您的求职数据安全。",
  keywords: ["隐私政策", "用户隐私保护", "招聘平台隐私", "个人信息安全", "数据保护"],
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold mb-8">隐私政策</h1>
          
          <div className="prose max-w-none text-gray-700">
            <p className="text-sm text-gray-500 mb-6">
              最后更新日期：2026年4月10日
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">1. 引言</h2>
            <p className="mb-4">
              招聘平台（以下简称{`"我们"`}）非常重视用户的隐私保护。本隐私政策说明我们如何收集、使用、
              存储和保护您的个人信息。请在使用我们的服务前仔细阅读本政策。
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">2. 信息收集</h2>
            <p className="mb-4">我们可能会收集以下类型的信息：</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>基本信息</strong>：姓名、邮箱、手机号、头像等</li>
              <li><strong>简历信息</strong>：教育背景、工作经历、技能等</li>
              <li><strong>设备信息</strong>：IP地址、浏览器类型、操作系统等</li>
              <li><strong>使用数据</strong>：访问页面、点击行为、搜索记录等</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">3. 信息使用</h2>
            <p className="mb-4">我们使用收集的信息用于：</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>提供、维护和改进我们的服务</li>
              <li>匹配合适的职位和候选人</li>
              <li>发送服务通知和营销信息（您可选择退订）</li>
              <li>防止欺诈和滥用行为</li>
              <li>进行数据分析和研究以改善用户体验</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">4. 信息共享</h2>
            <p className="mb-4">我们不会在未经您同意的情况下向第三方出售您的个人信息。但在以下情况下可能会共享信息：</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>企业用户</strong>：您申请的职位对应的企业HR可以查看您的简历</li>
              <li><strong>服务提供商</strong>：为我们提供技术支持的第三方服务商</li>
              <li><strong>法律要求</strong>：根据法律法规或政府部门要求</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">5. 信息保护</h2>
            <p className="mb-4">我们采取以下安全措施保护您的信息：</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>使用加密技术传输和存储敏感数据</li>
              <li>实施访问控制，限制员工访问权限</li>
              <li>定期进行安全审计和漏洞扫描</li>
              <li>建立应急响应机制应对安全事件</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">6. Cookie 使用</h2>
            <p className="mb-4">
              我们使用 Cookie 和类似技术来提升用户体验，包括：
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>必要 Cookie</strong>：确保网站正常运行</li>
              <li><strong>功能 Cookie</strong>：记住您的偏好设置</li>
              <li><strong>分析 Cookie</strong>：帮助我们了解用户行为以改进服务</li>
            </ul>
            <p className="mb-4">
              您可以通过浏览器设置管理 Cookie，但禁用 Cookie 可能影响某些功能的使用。
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">7. 您的权利</h2>
            <p className="mb-4">您对自己的个人信息拥有以下权利：</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>访问权</strong>：查看我们持有的关于您的信息</li>
              <li><strong>更正权</strong>：修改不准确或不完整的信息</li>
              <li><strong>删除权</strong>：要求删除您的个人信息</li>
              <li><strong>限制处理权</strong>：限制我们对您信息的处理</li>
              <li><strong>数据可携带权</strong>：获取您的数据副本</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">8. 数据保留</h2>
            <p className="mb-4">
              我们只会在必要的时间内保留您的个人信息，以实现本政策所述的目的或遵守法律要求。
              当您删除账号后，我们会在合理期限内删除或匿名化您的个人信息。
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">9. 未成年人保护</h2>
            <p className="mb-4">
              我们的服务不面向16岁以下的未成年人。如果我们发现收集了未成年人的个人信息，
              会立即采取措施删除相关信息。
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">10. 政策更新</h2>
            <p className="mb-4">
              我们可能会不时更新本隐私政策。更新后的政策将在本页面发布，重大变更我们会通过邮件或网站通知您。
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">11. 联系我们</h2>
            <p className="mb-4">
              如果您对本隐私政策有任何疑问或行使您的权利，请联系：<br />
              邮箱：privacy@jobs-platform.com<br />
              
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
