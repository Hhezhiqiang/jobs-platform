import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// GET /api/stories/[id]/resonance/check - Check if user has resonated
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ hasResonated: false });
    }

    const { id } = await params;

    const resonance = await prisma.storyResonance.findUnique({
      where: {
        storyId_userId: {
          storyId: id,
          userId: session.user.id,
        },
      },
    });

    return NextResponse.json({ hasResonated: !!resonance });
  } catch (error) {
    console.error("Error checking resonance:", error);
    return NextResponse.json(
      { error: "Failed to check resonance" },
      { status: 500 }
    );
  }
}
