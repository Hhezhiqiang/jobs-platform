import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidTrc20Address } from "@/lib/promoter";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { name, email, phone, walletAddress, parentCode } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "请填写姓名和邮箱" }, { status: 400 });
    }

    if (walletAddress && !isValidTrc20Address(walletAddress)) {
      return NextResponse.json({ error: "请输入有效的 TRC-20 地址" }, { status: 400 });
    }

    const existing = await prisma.promoters.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "该邮箱已申请" }, { status: 400 });
    }

    let parentPromoterId: string | null = null;
    if (parentCode) {
      const parentLink: any = await prisma.$queryRaw`
        SELECT "promoterId" FROM promoter_links WHERE code = ${parentCode} LIMIT 1
      `;
      if (parentLink.length > 0) {
        parentPromoterId = parentLink[0].promoterId;
      }
    }

    const data: any = { name, email, phone, walletAddress, status: "PENDING" };
    if (session?.user?.id) {
      data.userId = session.user.id;
    }

    const promoter = await prisma.promoters.create({ data });

    if (parentPromoterId) {
      const parentDepth: any = await prisma.$queryRaw`
        SELECT COALESCE("placement_depth", 0) as depth FROM promoters WHERE id = ${parentPromoterId}
      `;
      const newDepth = (parentDepth[0]?.depth || 0) + 1;

      const parentStats: any = await prisma.$queryRaw`
        SELECT COALESCE("left_team_count", 0) as leftCount, COALESCE("right_team_count", 0) as rightCount
        FROM promoters WHERE id = ${parentPromoterId}
      `;
      const side = parentStats[0].leftCount <= parentStats[0].rightCount ? "left" : "right";

      await prisma.$executeRaw`
        UPDATE promoters SET
          "parentId" = ${parentPromoterId},
          "placement_depth" = ${newDepth},
          level = ${newDepth}
        WHERE id = ${promoter.id}
      `;

      if (side === "left") {
        await prisma.$executeRaw`
          UPDATE promoters SET
            "parent_left_id" = ${parentPromoterId},
            "left_team_count" = COALESCE("left_team_count", 0) + 1
          WHERE id = ${parentPromoterId}
        `;
      } else {
        await prisma.$executeRaw`
          UPDATE promoters SET
            "parent_right_id" = ${parentPromoterId},
            "right_team_count" = COALESCE("right_team_count", 0) + 1
          WHERE id = ${parentPromoterId}
        `;
      }
    }

    return NextResponse.json({ success: true, promoterId: promoter.id });
  } catch (error) {
    logger.error("Promoter apply error:", error);
    return NextResponse.json({ error: "申请失败" }, { status: 500 });
  }
}
