import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
export const dynamic = "force-dynamic";

const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "txt", "md"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIP(req);
    const rateLimit = checkRateLimit(ip, 10, 60 * 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "上传过于频繁" }, { status: 429 });
    }

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

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ error: "仅支持 PDF、DOC、DOCX、TXT、MD 格式" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "文件大小不能超过 10MB" }, { status: 400 });
    }

    // 保存文件到 public/uploads/resumes/
    const uploadDir = join(process.cwd(), "public", "uploads", "resumes");
    await mkdir(uploadDir, { recursive: true });

    const fileId = `${session.user.id}-${Date.now()}.${ext}`;
    const filePath = join(uploadDir, fileId);
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, fileBuffer);

    const fileUrl = `/uploads/resumes/${fileId}`;

    const existingResumes = await prisma.resumes.count({
      where: { userId: session.user.id },
    });
    const isDefault = existingResumes === 0;

    const resume = await prisma.resumes.create({
      data: {
        userId: session.user.id,
        name: name || file.name,
        fileUrl,
        fileType: file.type || "application/octet-stream",
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
  } catch (error: any) {
    console.error("上传简历失败:", error);
    return NextResponse.json({ error: error.message || "上传失败，请稍后重试" }, { status: 500 });
  }
}
