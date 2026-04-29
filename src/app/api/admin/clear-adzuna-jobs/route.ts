import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

// DELETE /api/admin/clear-adzuna-jobs
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 删除所有 slug 以 adzuna- 开头的职位
    const result = await prisma.jobs.deleteMany({
      where: {
        slug: { startsWith: 'adzuna-' }
      }
    });

    return NextResponse.json({
      success: true,
      deleted: result.count,
      message: `已删除 ${result.count} 个 Adzuna 职位`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
