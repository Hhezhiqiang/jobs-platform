import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const promoterRows: any = await prisma.$queryRaw`
    SELECT id, COALESCE(level, 0) as level,
           "parent_left_id" as "parentLeftId", "parent_right_id" as "parentRightId"
    FROM promoters WHERE "userId" = ${session.user.id} LIMIT 1
  `;
  if (promoterRows.length === 0) return NextResponse.json({ error: "未注册推广员" }, { status: 404 });

  const upline: any[] = [];
  let currentId = promoterRows[0].id;
  for (let i = 0; i < 20; i++) {
    const parent: any = await prisma.$queryRaw`
      SELECT "parentId" FROM promoters WHERE id = ${currentId}
    `;
    if (!parent[0]?.parentId) break;
    currentId = parent[0].parentId;

    const uplineMember: any = await prisma.$queryRaw`
      SELECT id, name, email, COALESCE(level, 0) as level,
             "parent_left_id" as "parentLeftId", "parent_right_id" as "parentRightId"
      FROM promoters WHERE id = ${currentId}
    `;
    if (uplineMember.length > 0) upline.push(uplineMember[0]);
  }

  const mySide = promoterRows[0].parentLeftId ? "left" : promoterRows[0].parentRightId ? "right" : "root";

  return NextResponse.json({
    success: true,
    myLevel: promoterRows[0].level,
    mySide,
    upline,
  });
}
