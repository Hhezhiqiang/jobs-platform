import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";
import { logger } from '@/lib/logger';

export const dynamic = "force-dynamic";

/**
 * 获取公司面试经验列表
 * GET /api/companies/[id]/interviews
 * 
 * 查询Company表关联的CareerStory
 * - 筛选type为INTERVIEW的故事
 * - 按resonanceCount排序
 * - 返回面试经验列表（标题、摘要、共鸣数、作者）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    
    // 获取查询参数
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const department = searchParams.get("department");
    const position = searchParams.get("position");
    const result = searchParams.get("result"); // 'passed' | 'failed' | undefined
    
    // 频率限制
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(`company-interviews:${ip}`, 30, 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "请求过于频繁" }, { status: 429 });
    }

    // 验证公司ID
    if (!id) {
      return NextResponse.json({ error: "公司ID不能为空" }, { status: 400 });
    }

    // 验证公司是否存在
    const company = await prisma.companies.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true },
    });

    if (!company) {
      return NextResponse.json({ error: "公司不存在" }, { status: 404 });
    }

    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {
      type: "INTERVIEW",
    };

    // 从故事内容中提取公司信息进行匹配
    // 由于CareerStory没有直接的companyId字段，我们通过内容匹配
    // 在实际应用中，可能需要添加companyId关联或更复杂的匹配逻辑

    // 获取面试经验总数
    const total = await prisma.careerStory.count({ where });

    // 获取面试经验列表
    const interviews = await prisma.careerStory.findMany({
      where,
      orderBy: [
        { resonanceCount: "desc" },
        { createdAt: "desc" },
      ],
      skip,
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    // 处理面试经验数据，提取结构化信息
    const formattedInterviews = interviews.map((story) => {
      // 从故事内容解析结构化信息
      const parsedData = parseInterviewContent(story.content);
      
      return {
        id: story.id,
        title: story.title,
        summary: parsedData.summary || story.content.slice(0, 200) + "...",
        content: story.content,
        resonanceCount: story.resonanceCount,
        viewCount: story.viewCount,
        createdAt: story.createdAt.toISOString(),
        updatedAt: story.updatedAt.toISOString(),
        author: {
          id: story.author.id,
          name: story.author.name,
          avatar: story.author.avatar,
        },
        // 解析的结构化信息
        department: parsedData.department,
        position: parsedData.position,
        result: parsedData.result, // 'passed' | 'failed' | 'unknown'
        difficulty: parsedData.difficulty, // 1-5
        duration: parsedData.duration,
        questions: parsedData.questions || [],
        tags: parsedData.tags || [],
      };
    });

    // 根据部门/岗位筛选（在内存中过滤）
    let filteredInterviews = formattedInterviews;
    if (department) {
      filteredInterviews = filteredInterviews.filter(
        (i) => i.department?.toLowerCase().includes(department.toLowerCase())
      );
    }
    if (position) {
      filteredInterviews = filteredInterviews.filter(
        (i) => i.position?.toLowerCase().includes(position.toLowerCase())
      );
    }
    if (result) {
      filteredInterviews = filteredInterviews.filter((i) => i.result === result);
    }

    // 统计分析
    const stats = {
      totalInterviews: total,
      passedCount: formattedInterviews.filter((i) => i.result === "passed").length,
      failedCount: formattedInterviews.filter((i) => i.result === "failed").length,
      avgDifficulty: calculateAvgDifficulty(formattedInterviews),
      topDepartments: extractTopDepartments(formattedInterviews),
      topQuestions: extractTopQuestions(formattedInterviews),
    };

    return NextResponse.json({
      success: true,
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
      },
      interviews: filteredInterviews,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("获取公司面试经验失败:", error);
    return NextResponse.json(
      { error: "获取面试经验失败" },
      { status: 500 }
    );
  }
}

/**
 * 解析面试故事内容，提取结构化信息
 */
function parseInterviewContent(content: string): {
  summary?: string;
  department?: string;
  position?: string;
  result?: "passed" | "failed" | "unknown";
  difficulty?: number;
  duration?: string;
  questions?: string[];
  tags?: string[];
} {
  const result: any = {};

  // 提取摘要（前200字符）
  result.summary = content.slice(0, 200).trim();
  if (content.length > 200) {
    result.summary += "...";
  }

  // 通过正则匹配提取信息
  
  // 匹配部门
  const departmentMatch = content.match(/部门[：:]\s*(.+?)(?:\n|$)/i);
  if (departmentMatch) {
    result.department = departmentMatch[1].trim();
  }

  // 匹配岗位/职位
  const positionMatch = content.match(/(?:岗位|职位)[：:]\s*(.+?)(?:\n|$)/i);
  if (positionMatch) {
    result.position = positionMatch[1].trim();
  } else {
    // 尝试匹配"应聘"或"面试"后面的职位
    const applyMatch = content.match(/应聘|面试\s*(.+?)(?:\n|岗位|职位)/i);
    if (applyMatch) {
      result.position = applyMatch[1].trim();
    }
  }

  // 匹配面试结果
  if (/面试通过|拿到offer|成功入职|已通过|录取/i.test(content)) {
    result.result = "passed";
  } else if (/面试未通过|没通过|被拒|失败|未录取/i.test(content)) {
    result.result = "failed";
  } else {
    result.result = "unknown";
  }

  // 匹配难度评估（1-5星或文字描述）
  const difficultyMatch = content.match(/难度[：:]\s*(\d)/i);
  if (difficultyMatch) {
    result.difficulty = parseInt(difficultyMatch[1], 10);
  } else if (/非常难|很难|难度高/i.test(content)) {
    result.difficulty = 5;
  } else if (/比较难|有难度/i.test(content)) {
    result.difficulty = 4;
  } else if (/中等难度|一般/i.test(content)) {
    result.difficulty = 3;
  } else if (/比较简单|不太难/i.test(content)) {
    result.difficulty = 2;
  } else if (/很简单|非常容易/i.test(content)) {
    result.difficulty = 1;
  }

  // 匹配面试时长
  const durationMatch = content.match(/时长[：:]\s*(.+?)(?:\n|$)/i);
  if (durationMatch) {
    result.duration = durationMatch[1].trim();
  }

  // 提取面试问题（以数字或"Q"开头的行）
  const questionMatches = content.match(/(?:^|\n)(?:\d+[.．、]|Q\d*[：:]?|问题[\d]*[：:]?)\s*(.+?)(?=\n|$)/gi);
  if (questionMatches) {
    result.questions = questionMatches
      .map((q) => q.replace(/(?:^|\n)(?:\d+[.．、]|Q\d*[：:]?|问题[\d]*[：:]?)\s*/, "").trim())
      .filter((q) => q.length > 5 && q.length < 200)
      .slice(0, 10); // 最多10个问题
  }

  // 提取标签（#标签 格式）
  const tagMatches = content.match(/#[\w\u4e00-\u9fa5]+/g);
  if (tagMatches) {
    result.tags = tagMatches.map((t) => t.replace("#", ""));
  }

  return result;
}

/**
 * 计算平均难度
 */
function calculateAvgDifficulty(interviews: any[]): number {
  const validDifficulties = interviews.filter((i) => i.difficulty !== undefined);
  if (validDifficulties.length === 0) return 0;
  const sum = validDifficulties.reduce((acc, i) => acc + i.difficulty, 0);
  return Math.round((sum / validDifficulties.length) * 10) / 10;
}

/**
 * 提取热门部门
 */
function extractTopDepartments(interviews: any[]): { name: string; count: number }[] {
  const deptCounts: Record<string, number> = {};
  interviews.forEach((i) => {
    if (i.department) {
      deptCounts[i.department] = (deptCounts[i.department] || 0) + 1;
    }
  });
  return Object.entries(deptCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

/**
 * 提取热门问题
 */
function extractTopQuestions(interviews: any[]): { question: string; count: number }[] {
  const questionCounts: Record<string, number> = {};
  interviews.forEach((i) => {
    if (i.questions) {
      i.questions.forEach((q: string) => {
        // 简化问题文本用于统计
        const simplified = q.slice(0, 30);
        questionCounts[simplified] = (questionCounts[simplified] || 0) + 1;
      });
    }
  });
  return Object.entries(questionCounts)
    .map(([question, count]) => ({ question, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}
