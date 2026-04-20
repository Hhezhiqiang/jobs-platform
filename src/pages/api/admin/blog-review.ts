/**
 * 博客内容审核 API
 * 管理员可以审核、编辑、发布/下架自动生成的博客草稿
 */

import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || session.user.role !== "ADMIN") {
    return res.status(403).json({ error: "需要管理员权限" });
  }

  if (req.method === "GET") {
    return handleGetDrafts(req, res);
  }
  
  if (req.method === "POST") {
    return handleReview(req, res);
  }

  return res.status(405).json({ error: "Method not allowed" });
}

async function handleGetDrafts(req: NextApiRequest, res: NextApiResponse) {
  const { status, page = "1", limit = "20" } = req.query;
  
  const where: any = { type: "BLOG" };
  if (status && status !== "all") {
    where.status = status;
  }

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);

  const [posts, total] = await Promise.all([
    prisma.pages.findMany({
      where,
      include: {
        users: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    prisma.pages.count({ where }),
  ]);

  return res.status(200).json({
    posts,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
  });
}

async function handleReview(req: NextApiRequest, res: NextApiResponse) {
  const { action, postId, title, content, excerpt, metaTitle, metaDescription } = req.body;

  if (!postId || !action) {
    return res.status(400).json({ error: "缺少必要参数" });
  }

  const post = await prisma.pages.findUnique({
    where: { id: postId },
  });

  if (!post || post.type !== "BLOG") {
    return res.status(404).json({ error: "文章不存在" });
  }

  switch (action) {
    case "publish": {
      const updated = await prisma.pages.update({
        where: { id: postId },
        data: {
          status: "PUBLISHED",
          ...(title && { title }),
          ...(content && { content }),
          ...(excerpt && { excerpt }),
          ...(metaTitle && { metaTitle }),
          ...(metaDescription && { metaDescription }),
        },
      });
      return res.json({ success: true, post: updated });
    }

    case "reject": {
      await prisma.pages.update({
        where: { id: postId },
        data: { status: "DRAFT" },
      });
      return res.json({ success: true, message: "已退回草稿" });
    }

    case "delete": {
      await prisma.pages.delete({
        where: { id: postId },
      });
      return res.json({ success: true, message: "已删除" });
    }

    case "update": {
      const updated = await prisma.pages.update({
        where: { id: postId },
        data: {
          ...(title && { title }),
          ...(content && { content }),
          ...(excerpt && { excerpt }),
          ...(metaTitle && { metaTitle }),
          ...(metaDescription && { metaDescription }),
        },
      });
      return res.json({ success: true, post: updated });
    }

    default:
      return res.status(400).json({ error: "未知操作" });
  }
}
