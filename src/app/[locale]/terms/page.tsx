import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  return {
    title: isEn ? "Terms of Service | JobQuip" : "用户协议 | JobQuip",
    description: isEn ? "Terms of service for JobQuip recruitment platform." : "JobQuip招聘平台用户协议。",
    robots: { index: false, follow: true },
  };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isEn = locale === "en";
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold mb-8">用户服务协议</h1>
          
          <div className="prose max-w-none text-gray-700">
            <p className="text-sm text-gray-500 mb-6">
              isEn ? "Last updated" : "最后更新日期"：2026年4月10日
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">1. 协议范围</h2>
            <p className="mb-4">
              欢迎使用招聘平台！本协议是您与招聘平台之间关于使用本平台服务的协议。
              通过注册、登录或使用本平台服务，即表示您同意接受本协议的全部条款。
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">2. 账号注册</h2>
            <p className="mb-4">
              2.1 您承诺以真实身份注册，并保证所提供的个人资料真实、准确、完整。
            </p>
            <p className="mb-4">
              2.2 您有责任妥善保管账号和密码，对账号下的所有行为承担法律责任。
            </p>
            <p className="mb-4">
              2.3 如发现账号被盗或存在安全问题，应立即通知本平台。
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">3. 服务内容</h2>
            <p className="mb-4">
              3.1 本平台为用户提供求职招聘信息服务，包括职位发布、简历投递、在线申请等功能。
            </p>
            <p className="mb-4">
              3.2 企业用户可以发布职位信息、查看求职者简历、管理招聘流程。
            </p>
            <p className="mb-4">
              3.3 个人用户可以创建简历、浏览职位、申请工作。
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">4. 用户行为规范</h2>
            <p className="mb-4">用户承诺在使用本平台服务时遵守以下规范：</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>不得发布虚假、欺诈、违法信息</li>
              <li>不得侵犯他人知识产权或其他合法权益</li>
              <li>不得从事任何形式的骚扰、歧视行为</li>
              <li>不得利用平台从事任何非法活动</li>
              <li>不得干扰平台正常运行或破坏平台数据</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">5. 信息保护</h2>
            <p className="mb-4">
              5.1 本平台重视用户隐私保护，具体请参阅《隐私政策》。
            </p>
            <p className="mb-4">
              5.2 用户同意本平台为提供服务之目的收集、使用、存储相关个人信息。
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">6. 知识产权</h2>
            <p className="mb-4">
              6.1 本平台的所有内容，包括但不限于文字、图片、代码、商标等，均受知识产权保护。
            </p>
            <p className="mb-4">
              6.2 用户在本平台发布的内容，视为授予本平台非独占、可转让的使用许可。
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">7. 免责声明</h2>
            <p className="mb-4">
              7.1 本平台仅提供信息展示服务，不对招聘信息的真实性、准确性做任何担保。
            </p>
            <p className="mb-4">
              7.2 用户应自行判断信息真伪，因使用本平台服务产生的任何损失，本平台不承担责任。
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">8. 协议修改</h2>
            <p className="mb-4">
              本平台有权随时修改本协议，修改后的协议将在平台上公布。如用户继续使用服务，视为接受修改后的协议。
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">9. 争议解决</h2>
            <p className="mb-4">
              本协议的订立、执行和解释及争议的解决均适用中华人民共和国法律。
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">10. 联系我们</h2>
            <p className="mb-4">
              如您对本协议有任何疑问，请联系：<br />
              
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
