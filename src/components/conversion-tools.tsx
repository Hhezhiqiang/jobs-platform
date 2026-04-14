import Link from "next/link";
import { Calculator, FileText, TrendingUp, MessageSquare, ArrowRight } from "lucide-react";

interface ConversionToolsProps {
  blogKeywords?: string[];
}

export function ConversionTools({ blogKeywords = [] }: ConversionToolsProps) {
  // 根据博客关键词判断显示哪些工具
  const hasSalaryContent = blogKeywords.some(kw => 
    ["薪资", "工资", "薪酬", "待遇", "package", "总包"].some(s => kw.includes(s))
  );
  
  const hasResumeContent = blogKeywords.some(kw =>
    ["简历", "CV", "履历", "面试"].some(s => kw.includes(s))
  );
  
  const hasCareerContent = blogKeywords.some(kw =>
    ["职业规划", "发展", "转行", "跳槽", "晋升"].some(s => kw.includes(s))
  );

  const tools = [
    {
      icon: Calculator,
      title: "薪资计算器",
      description: "计算税后收入、五险一金、年终奖",
      href: "/tools/salary-calculator",
      show: hasSalaryContent || true, // 默认显示
      color: "bg-green-50 text-green-600",
    },
    {
      icon: FileText,
      title: "简历诊断",
      description: "AI智能分析简历，提供优化建议",
      href: "/tools/resume-review",
      show: hasResumeContent || true,
      color: "bg-blue-50 text-blue-600",
    },
    {
      icon: TrendingUp,
      title: "薪资对比",
      description: "查看同行业同岗位薪资水平",
      href: "/tools/salary-comparison",
      show: hasSalaryContent || true,
      color: "bg-purple-50 text-purple-600",
    },
    {
      icon: MessageSquare,
      title: "求职咨询",
      description: "专业顾问1对1职业规划指导",
      href: "/consulting",
      show: hasCareerContent || true,
      color: "bg-orange-50 text-orange-600",
    },
  ].filter(t => t.show);

  if (tools.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mt-8">
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        相关求职工具
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tools.map((tool) => (
          <Link
            key={tool.title}
            href={tool.href}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <div className={`w-10 h-10 rounded-lg ${tool.color} flex items-center justify-center flex-shrink-0`}>
              <tool.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                  {tool.title}
                </span>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{tool.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
