export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug") || "mexc--1775816717114-7";
  
  try {
    const job = await prisma.jobs.findUnique({
      where: { slug },
      include: { companies: true },
    });
    
    if (!job) {
      return NextResponse.json({ error: "not found", slug });
    }
    
    return NextResponse.json({ 
      ok: true, 
      title: job.title,
      company: job.companies?.name,
      datePosted: job.datePosted,
      updatedAt: job.updatedAt,
    });
  } catch (e: any) {
    return NextResponse.json({ 
      error: "query failed", 
      message: e.message,
      stack: e.stack?.split('\n').slice(0, 3),
    }, { status: 500 });
  }
}
