import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "常见问题 - 招聘平台求职招聘指南",
  description: "招聘平台常见问题解答，包括账号注册、职位申请、简历投递、面试技巧等求职招聘相关问题。",
  keywords: ["招聘平台", "求职问题", "简历投递", "面试技巧", "职位申请", "找工作常见问题"],
  alternates: {
    canonical: "https://jobs-platform-gold.vercel.app/faq",
  },
};

// FAQ 数据结构 - 用于 Schema.org
const faqData = [
  {
    question: "如何在招聘平台注册账号？",
    answer: "点击页面右上角'注册'按钮，填写邮箱、密码、姓名等基本信息即可完成注册。注册后您可以创建简历、投递职位、跟踪申请进度。支持邮箱验证确保账号安全。"
  },
  {
    question: "招聘平台的职位信息真实吗？",
    answer: "我们对所有发布职位的企业进行严格审核，确保职位信息真实有效。每个职位都经过人工审核，企业需通过营业执照认证。如发现虚假信息，请立即举报，我们会第一时间处理。"
  },
  {
    question: "投递简历后多久能收到回复？",
    answer: "一般情况下，企业在收到简历后3-7个工作日内会进行筛选。您可以在'我的申请'中查看简历状态：待处理、已查看、面试邀请、已录用、已拒绝。建议同时投递多个职位以增加机会。"
  },
  {
    question: "如何写好一份求职简历？",
    answer: "1) 使用STAR法则描述项目经历；2) 量化工作成果，如'提升性能40%'；3) 关键词匹配目标职位JD；4) 保持简洁，1-2页为宜；5) 检查错别字和格式。平台提供简历模板和优化建议。"
  },
  {
    question: "面试时应该如何谈薪资？",
    answer: "1) 提前调研市场薪资水平；2) 了解目标公司薪资结构（Base+奖金+股票）；3) 给出一个合理的薪资范围而非固定数字；4) 强调自己的价值和贡献；5) 考虑总包而非只看月薪。可以参考我们博客的谈薪技巧文章。"
  },
  {
    question: "2026年哪些岗位需求量最大？",
    answer: "根据平台数据统计，2026年需求最旺盛的岗位包括：AI工程师、前端开发工程师、产品经理、数据分析师、算法工程师、运维工程师。这些岗位薪资水平较高，发展前景良好。"
  },
  {
    question: "招聘平台支持哪些城市的工作？",
    answer: "我们覆盖全国主要城市，包括北京、上海、深圳、广州、杭州、成都、武汉、西安、南京、苏州等一线和新一线城市。您可以在职位搜索中按城市筛选，找到本地或异地工作机会。"
  },
  {
    question: "如何修改或撤回已投递的简历？",
    answer: "登录账号后，进入'我的申请'页面，找到对应的职位申请。在HR未查看前，您可以撤回申请；撤回后可以修改简历重新投递。一旦HR已查看，则无法撤回，但可以联系HR说明情况。"
  },
  {
    question: "应届生如何在平台找到第一份工作？",
    answer: "1) 完善教育背景和实习经历；2) 关注'应届生'标签的职位；3) 参加校园招聘专场；4) 准备充分的自我介绍和项目介绍；5) 保持积极心态，多投多面。平台设有应届生专区，提供针对性的职位推荐。"
  },
  {
    question: "平台如何保护用户隐私？",
    answer: "我们采用银行级加密技术保护用户数据，未经您的同意不会向第三方透露个人信息。简历仅对投递的企业可见，您也可以设置简历的公开/私密状态。详细请参阅我们的《隐私政策》。"
  },
  {
    question: "企业如何在平台发布职位？",
    answer: "企业用户需先完成企业认证（提交营业执照），审核通过后即可发布职位。支持批量发布、职位刷新、简历筛选等功能。联系我们的商务团队获取更多企业合作信息。"
  },
  {
    question: "遇到招聘诈骗怎么办？",
    answer: "1) 立即停止联系并保留证据；2) 向平台举报该职位或企业；3) 如涉及财产损失，及时报警；4) 提醒其他求职者注意。平台严禁任何形式的招聘诈骗，发现一起处理一起。"
  }
];

export default function FAQPage() {
  // 生成 FAQPage Schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqData.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </head>

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              招聘平台
            </Link>
            <nav className="flex gap-6">
              <Link href="/jobs" className="text-gray-600 hover:text-blue-600">
                职位
              </Link>
              <Link href="/blog" className="text-gray-600 hover:text-blue-600">
                博客
              </Link>
              <Link href="/faq" className="text-blue-600 font-medium">
                常见问题
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">常见问题解答</h1>
          <p className="text-xl text-blue-100">
            关于求职招聘的一切问题，在这里找到答案
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-6">
          {faqData.map((item, index) => (
            <article
              key={index}
              className="bg-white rounded-lg shadow p-6"
              itemScope
              itemProp="mainEntity"
              itemType="https://schema.org/Question"
            >
              <h2 
                className="text-xl font-semibold text-gray-900 mb-3 flex items-start gap-3"
                itemProp="name"
              >
                <span className="text-blue-600 flex-shrink-0">Q{index + 1}.</span>
                <span>{item.question}</span>
              </h2>
              <div
                itemScope
                itemProp="acceptedAnswer"
                itemType="https://schema.org/Answer"
              >
                <div 
                  className="text-gray-700 leading-relaxed pl-8"
                  itemProp="text"
                >
                  {item.answer}
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 bg-blue-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">还有其他问题？</h2>
          <p className="text-gray-600 mb-6">
            如果没有找到您想要的答案，欢迎联系我们的客服团队
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/about"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              联系我们
            </Link>
            <Link
              href="/blog"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg border border-blue-600 hover:bg-blue-50"
            >
              查看更多文章
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">
            &copy; 2026 招聘平台 | 
            <Link href="/terms" className="hover:text-white">用户协议</Link> | 
            <Link href="/privacy" className="hover:text-white">隐私政策</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
