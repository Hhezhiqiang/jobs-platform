export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getAuthenticatedPromoter } from "@/lib/promoter-auth";
import { prisma } from "@/lib/prisma";
import { generateUniquePromoCode } from "@/lib/promoter";

export async function GET() {
  const auth = await getAuthenticatedPromoter();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { promoter } = auth;

  try {
    const links = await prisma.promoterLink.findMany({
      where: { promoterId: promoter.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, links });
  } catch (error) {
    console.error("Promoter links error:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await getAuthenticatedPromoter();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { promoter } = auth;

  try {
    const body = await request.json();
    const { name, customRate, landingPage } = body;

    if (!name) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 });
    }

    const rateNum = customRate !== undefined && customRate !== null ? Number(customRate) : null;
    if (rateNum !== null && (rateNum < 1 || rateNum > 98)) {
      return NextResponse.json({ error: "返佣比例需在 1%~98% 之间" }, { status: 400 });
    }

    const lp = typeof landingPage === "string" && landingPage.startsWith("/") ? landingPage : "/";
    const code = await generateUniquePromoCode();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jobs-platform.com";
    const fullUrl = `${siteUrl}${lp}${lp.includes("?") ? "&" : "?"}ref=${code}`;

    const link = await prisma.promoterLink.create({
      data: {
        promoterId: promoter.id,
        name,
        code,
        customRate: rateNum !== null ? rateNum : null,
        landingPage: lp,
      },
    });

    return NextResponse.json({ success: true, link: { ...link, fullUrl } });
  } catch (error) {
    console.error("Promoter link create error:", error);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
