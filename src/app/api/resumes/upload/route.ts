import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile } from "fs/promises";
import { join } from "path";
import { mkdir } from "fs/promises";
import { randomUUID } from "crypto";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";
export const dynamic = "force-dynamic";

// 允许的文件扩展名白名单
const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "txt", "md"];

// MIME 到扩展名映射（仅用于参考，真实类型由魔数决定）
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const EXTENSION_MAP: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "text/plain": ".txt",
  "text/markdown": ".md",
};

// 最大文件大小 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function getExtensionByMagic(buffer: Buffer): string | null {
  if (buffer.length < 4) return null;
  const header = buffer.slice(0, 4).toString("hex").toLowerCase();
  if (header.startsWith("25504446")) return ".pdf";
  if (header.startsWith("504b0304")) return ".docx";
  if (header.startsWith("d0cf11e0")) return ".doc";
  // txt / md 统一按 text 处理（UTF-8 BOM 或纯文本）
  const isText = isUtf8OrAscii(buffer);
  if (isText) {
    // 无法区分 txt 和 md，返回 .txt 让后续按原始扩展名覆盖
    return ".txt";
  }
  return null;
}

function isUtf8OrAscii(buffer: Buffer): boolean {
  // 简单的 UTF-8 BOM 或 ASCII 检测
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return true;
  }
  // 抽样检测是否全为可打印 ASCII / 空白字符
  const sample = buffer.slice(0, Math.min(buffer.length, 512));
  let highBytes = 0;
  for (let i = 0; i < sample.length; i++) {
    const b = sample[i];
    if (b === 0) return false; // 二进制文件通常含 null
    if (b > 127) highBytes++;
  }
  // 若高字节比例低，视为文本
  return highBytes / sample.length < 0.3;
}

function getClientExtension(name: string): string | null {
  const ext = name.split(".").pop()?.toLowerCase();
  if (!ext) return null;
  return ALLOWED_EXTENSIONS.includes(ext) ? `.${ext}` : null;
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIP(req);
    const rateLimit = checkRateLimit(ip, 10, 60 * 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "上传过于频繁，请稍后再试" },
        { status: 429 }
      );
    }

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

    // 验证文件扩展名白名单
    const clientExt = getClientExtension(file.name);
    if (!clientExt || !ALLOWED_EXTENSIONS.includes(clientExt.slice(1))) {
      return NextResponse.json(
        { error: "仅支持 PDF、DOC、DOCX、TXT、MD 格式的文件" },
        { status: 400 }
      );
    }

    // 读取文件 buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // 魔数校验真实文件类型
    const magicExt = getExtensionByMagic(buffer);
    if (!magicExt) {
      return NextResponse.json(
        { error: "文件类型不合法或已损坏" },
        { status: 400 }
      );
    }

    // 对 txt/md 放宽到允许文本类型互转；对其他类型要求魔数匹配扩展名大类
    const isTextLike = clientExt === ".txt" || clientExt === ".md";
    const magicIsText = magicExt === ".txt";
    if (!isTextLike) {
      if (magicExt !== clientExt) {
        return NextResponse.json(
          { error: "文件扩展名与真实文件类型不一致" },
          { status: 400 }
        );
      }
    } else {
      if (!magicIsText) {
        return NextResponse.json(
          { error: "该文件不是合法的文本文件" },
          { status: 400 }
        );
      }
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "文件大小不能超过 10MB" },
        { status: 400 }
      );
    }

    // 生成唯一文件名（使用客户端扩展名，txt/md 是安全的）
    const fileId = randomUUID();
    const extension = clientExt;
    const fileName = `${fileId}${extension}`;

    // 确保上传目录存在
    const uploadDir = join(process.cwd(), "public", "uploads", "resumes");
    await mkdir(uploadDir, { recursive: true });

    // 保存文件
    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // 相对路径用于访问
    const fileUrl = `/uploads/resumes/${fileName}`;

    // 检查是否是用户的第一份简历，如果是则设为默认
    const existingResumes = await prisma.resumes.count({
      where: { userId: session.user.id },
    });
    const isDefault = existingResumes === 0;

    // 保存到数据库
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
      resumes: {
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
