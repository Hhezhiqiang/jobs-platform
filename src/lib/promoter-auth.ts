import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getAuthenticatedPromoter() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { error: "请先登录", status: 401 } as const;
  }

  // 优先通过 userId 关联查找（最可靠）
  const promoter = await prisma.promoter.findFirst({
    where: {
      OR: [
        { userId: session.user.id },
        { email: session.user.email },
      ],
    },
  });

  if (!promoter) {
    return { error: "您还不是推广者，请先申请", status: 403 } as const;
  }

  return { promoter, session } as const;
}
