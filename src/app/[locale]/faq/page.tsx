import { Metadata } from "next";
import Link from "next/link";
import { Search, MessageCircle, Mail, ChevronRight, HelpCircle } from "lucide-react";

const faqDataZh = [
  {
    category: "账号相关",
    items: [
      {
        question: "如何在招聘平台注册账号？",
        answer: "点击页面右上角'注册'按钮，填写邮箱、密码、姓名等基本信息即可完成注册。注册后您可以创建简历、投递职位、跟踪申请进度。支持邮箱验证确保账号安全。"
      },
      {
        question: "如何修改或撤回已投递的简历？",
        answer: "登录账号后，进入'我的申请'页面，找到对应的职位申请。在HR未查看前，您可以撤回申请；撤回后可以修改简历重新投递。一旦HR已查看，则无法撤回，但可以联系HR说明情况。"
      },
      {
        question: "平台如何保护用户隐私？",
        answer: "我们采用银行级加密技术保护用户数据，未经您的同意不会向第三方透露个人信息。简历仅对投递的企业可见，您也可以设置简历的公开/私密状态。详细请参阅我们的《隐私政策》。"
      },
    ]
  },
  {
    category: "求职相关",
    items: [
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
    ]
  },
  {
    category: "职位相关",
    items: [
      {
        question: "招聘平台的职位信息真实吗？",
        answer: "我们对所有发布职位的企业进行严格审核，确保职位信息真实有效。每个职位都经过人工审核，企业需通过营业执照认证。如发现虚假信息，请立即举报，我们会第一时间处理。"
      },
      {
        question: "2026年哪些岗位需求量最大？",
        answer: "根据平台数据统计，2026年需求最旺盛的岗位包括：AI工程师、前端开发工程师、产品经理、数据分析师、算法工程师、运维工程师。这些岗位薪资水平较高，发展前景良好。"
      },
      {
        question: "招聘平台支持哪些城市的工作？",
        answer: "我们覆盖全国主要城市，包括北京、上海、深圳、广州、杭州、成都、武汉、西安、南京、苏州等一线和新一线城市。您可以在职位搜索中按城市筛选，找到本地或异地工作机会。"
      },
    ]
  },
  {
    category: "企业相关",
    items: [
      {
        question: "企业如何在平台发布职位？",
        answer: "企业用户需先完成企业认证（提交营业执照），审核通过后即可发布职位。支持批量发布、职位刷新、简历筛选等功能。联系我们的商务团队获取更多企业合作信息。"
      },
      {
        question: "遇到招聘诈骗怎么办？",
        answer: "1) 立即停止联系并保留证据；2) 向平台举报该职位或企业；3) 如涉及财产损失，及时报警；4) 提醒其他求职者注意。平台严禁任何形式的招聘诈骗，发现一起处理一起。"
      },
    ]
  },
];

const faqDataEn = [
  {
    category: "Account",
    items: [
      {
        question: "How do I register on the platform?",
        answer: "Click the 'Register' button in the top right corner and fill in your email, password, and name. After registration, you can create a resume, apply for jobs, and track your application progress."
      },
      {
        question: "How can I modify or withdraw a submitted resume?",
        answer: "After logging in, go to 'My Applications' and find the relevant job application. You can withdraw it before HR reviews it. Once HR has viewed it, you cannot withdraw but can contact HR to explain."
      },
      {
        question: "How does the platform protect user privacy?",
        answer: "We use bank-level encryption to protect your data. Your resume is only visible to employers you apply to. You can also set your resume to public or private. See our Privacy Policy for details."
      },
    ]
  },
  {
    category: "Job Seeking",
    items: [
      {
        question: "How long after applying will I hear back?",
        answer: "Typically, employers review resumes within 3-7 business days. You can check your resume status in 'My Applications'. We recommend applying to multiple positions to increase your chances."
      },
      {
        question: "How do I write a great resume?",
        answer: "1) Use the STAR method to describe projects; 2) Quantify achievements, e.g., 'improved performance by 40%'; 3) Match keywords to the job description; 4) Keep it concise, 1-2 pages; 5) Check for typos. The platform provides resume templates and optimization tips."
      },
      {
        question: "How should I negotiate salary during interviews?",
        answer: "1) Research market salary levels beforehand; 2) Understand the target company's compensation structure (Base + Bonus + Stock); 3) Give a reasonable range rather than a fixed number; 4) Emphasize your value and contributions; 5) Consider the total compensation package."
      },
    ]
  },
  {
    category: "Jobs",
    items: [
      {
        question: "Are the job listings on the platform real?",
        answer: "We strictly verify all companies that post jobs to ensure the information is authentic. Each listing goes through manual review, and companies must pass business license verification. If you find false information, please report it immediately."
      },
      {
        question: "Which roles have the highest demand in 2026?",
        answer: "Based on platform data, the most in-demand roles in 2026 include: AI Engineers, Frontend Developers, Product Managers, Data Analysts, Algorithm Engineers, and DevOps Engineers. These positions offer competitive salaries and strong career prospects."
      },
      {
        question: "Which cities does the platform cover?",
        answer: "We cover major cities across China, including Beijing, Shanghai, Shenzhen, Guangzhou, Hangzhou, Chengdu, Wuhan, Xi'an, Nanjing, and Suzhou. You can filter by city in job search to find local or remote opportunities."
      },
    ]
  },
  {
    category: "Employers",
    items: [
      {
        question: "How can employers post jobs on the platform?",
        answer: "Employers need to complete company verification (submit business license) first. After approval, you can post jobs, refresh listings, and screen resumes. Contact our business team for more enterprise cooperation information."
      },
      {
        question: "What should I do if I encounter recruitment fraud?",
        answer: "1) Stop contact immediately and preserve evidence; 2) Report the job or company to the platform; 3) If financial loss is involved, contact the police; 4) Alert other job seekers. The platform strictly prohibits recruitment fraud."
      },
    ]
  },
];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com";
  const zh = `${siteUrl}/${locale}`;
  const isEn = locale === "en";

  return {
    title: isEn ? "FAQ - Job Recruitment Platform Guide" : "常见问题 - 招聘平台求职招聘指南",
    description: isEn
      ? "Frequently asked questions about job seeking, resume tips, interview skills, job applications, and more on our recruitment platform."
      : "招聘平台常见问题解答，包括账号注册、职位申请、简历投递、面试技巧等求职招聘相关问题。",
    keywords: isEn
      ? ["recruitment platform", "job seeking", "resume tips", "interview skills", "job application", "FAQ"]
      : ["招聘平台", "求职问题", "简历投递", "面试技巧", "职位申请", "找工作常见问题"],
    openGraph: {
      title: isEn ? "FAQ - Job Recruitment Platform Guide" : "常见问题 - 招聘平台求职招聘指南",
      description: isEn
        ? "Frequently asked questions about job seeking, resume tips, interview skills, and more."
        : "招聘平台常见问题解答，包括账号注册、职位申请、简历投递、面试技巧等求职招聘相关问题。",
      url: `${zh}/faq`,
      siteName: isEn ? "JobQuip" : "招聘平台",
      type: "website",
      locale: isEn ? "en_US" : "zh_CN",
      images: [`${siteUrl}/logo.png`],
    },
    twitter: {
      card: "summary_large_image",
      title: isEn ? "FAQ - Job Recruitment Platform Guide" : "常见问题 - 招聘平台求职招聘指南",
      description: isEn
        ? "Frequently asked questions about job seeking and recruitment."
        : "招聘平台常见问题解答。",
      images: [`${siteUrl}/logo.png`],
    },
    alternates: {
      canonical: `${zh}/faq`,
      languages: {
        "zh-CN": `${siteUrl}/zh/faq`,
        "en": `${siteUrl}/en/faq`,
        "x-default": `${siteUrl}/zh/faq`,
      },
    },
  };
}

export default async function FAQPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isEn = locale === "en";
  const faqData = isEn ? faqDataEn : faqDataZh;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqData.flatMap(cat => cat.items.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    })))
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      
      <div className="min-h-screen bg-gray-50">

        {/* Hero */}
        <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
          <div className="max-w-4xl mx-auto px-4 py-16 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm mb-6">
              <HelpCircle className="w-4 h-4" />
              {isEn ? "Help Center" : "帮助中心"}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {isEn ? "Frequently Asked Questions" : "常见问题解答"}
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              {isEn
                ? "Find answers to all your job seeking and recruitment questions here"
                : "关于求职招聘的一切问题，在这里找到答案"}
            </p>

            <div className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="search"
                  placeholder={isEn ? "Search questions..." : "搜索问题..."}
                  className="w-full pl-12 pr-4 py-4 bg-white rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-white/20"
                />
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Content */}
        <main className="max-w-4xl mx-auto px-4 py-12">
          {faqData.map((category, catIndex) => (
            <div key={category.category} className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-lg">
                  {catIndex + 1}
                </span>
                {category.category}
              </h2>
              
              <div className="space-y-4">
                {category.items.map((item, index) => (
                  <article
                    key={index}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-start gap-3">
                      <MessageCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>{item.question}</span>
                    </h3>
                    <div className="text-gray-700 leading-relaxed pl-8">
                      {item.answer}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}

          {/* Contact CTA */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-4">
              {isEn ? "Still have questions?" : "还有其他问题？"}
            </h2>
            <p className="text-blue-100 mb-6">
              {isEn
                ? "If you didn't find the answer you're looking for, feel free to contact our support team"
                : "如果没有找到您想要的答案，欢迎联系我们的客服团队"}
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href={`/${locale}/contact`}
                className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all flex items-center gap-2"
              >
                <Mail className="w-5 h-5" />
                {isEn ? "Contact Us" : "联系我们"}
              </Link>
              <Link
                href={`/${locale}/blog`}
                className="px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20 flex items-center gap-2"
              >
                {isEn ? "More Articles" : "查看更多文章"}
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
