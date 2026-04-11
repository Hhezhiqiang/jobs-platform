import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile } from "fs/promises";
import { join } from "path";
import { mkdir } from "fs/promises";
import { randomUUID } from "crypto";

// 允许的文件类型
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// 文件扩展名映射
const EXTENSION_MAP: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
};

// 最大文件大小 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    // 验证用户
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const name = formData.get("name") as string;

    if (!file) {
      return NextResponse.json({ error: "请选择文件" }, { status: 400 });
    }

    // 验证文件类型
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "仅支持 PDF、DOC、DOCX 格式的文件" },
        { status: 400 }
      );
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "文件大小不能超过 10MB" },
        { status: 400 }
      );
    }

    // 生成唯一文件名
    const fileId = randomUUID();
    const extension = EXTENSION_MAP[file.type];
    const fileName = `${fileId}${extension}`;

    // 确保上传目录存在
    const uploadDir = join(process.cwd(), "public", "uploads", "resumes");
    await mkdir(uploadDir, { recursive: true });

    // 保存文件
    const filePath = join(uploadDir, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // 相对路径用于访问
    const fileUrl = `/uploads/resumes/${fileName}`;

    // 检查是否是用户的第一份简历，如果是则设为默认
    const existingResumes = await prisma.resume.count({
      where: { userId: session.user.id },
    });
    const isDefault = existingResumes === 0;

    // 保存到数据库
    const resume = await prisma.resume.create({
      data: {
        userId: session.user.id,
        name: name || file.name,
        fileUrl,
        fileType: file.type,
        fileSize: file.size,
        isDefault,
      },
    });

    return NextResponse.json({
      success: true,
      resume: {
        id: resume.id,
        name: resume.name,
        fileUrl: resume.fileUrl,
        fileType: resume.fileType,
        fileSize: resume.fileSize,
        isDefault: resume.isDefault,
        createdAt: resume.createdAt,
      },
    });
  } catch (error) {
    console.error("上传简历失败:", error);
    return NextResponse.json({ error: "上传失败，请稍后重试" }, { status: 500 });
  }
}
