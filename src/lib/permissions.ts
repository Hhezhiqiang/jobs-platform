import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";

/**
 * 检查用户是否是企业成员
 */
export async function checkCompanyPermission(
  userId: string,
  userRole: string,
  companyId?: string
) {
  // 管理员有所有权限
  if (userRole === "ADMIN") {
    return { allowed: true, companyId: null, role: "ADMIN" };
  }

  // 查找用户的企业成员身份
  const where: Prisma.CompanyMemberWhereInput = { userId };
  if (companyId) {
    where.companyId = companyId;
  }

  const membership = await prisma.companyMember.findFirst({
    where,
    include: {
      company: true,
    },
  });

  if (!membership) {
    return { allowed: false, companyId: null, role: null };
  }

  return {
    allowed: true,
    companyId: membership.companyId,
    role: membership.role,
  };
}

/**
 * 检查用户是否可以管理特定职位
 */
export async function checkJobPermission(
  userId: string,
  userRole: string,
  jobId: string
) {
  // 管理员有所有权限
  if (userRole === "ADMIN") {
    return { allowed: true, companyId: null, role: "ADMIN" };
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      company: {
        include: {
          members: {
            where: { userId },
          },
        },
      },
    },
  });

  if (!job) {
    return { allowed: false, companyId: null, role: null };
  }

  const membership = job.company.members[0];
  if (!membership) {
    return { allowed: false, companyId: null, role: null };
  }

  // RECRUITER 和 ADMIN 可以编辑，VIEWER 只能查看
  const canEdit = membership.role === "ADMIN" || membership.role === "RECRUITER";

  return {
    allowed: true,
    companyId: job.companyId,
    role: membership.role,
    canEdit,
  };
}

/**
 * 检查用户是否可以管理特定申请
 */
export async function checkApplicationPermission(
  userId: string,
  userRole: string,
  applicationId: string
) {
  // 管理员有所有权限
  if (userRole === "ADMIN") {
    return { allowed: true, companyId: null, role: "ADMIN" };
  }

  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: {
      job: {
        include: {
          company: {
            include: {
              members: {
                where: { userId },
              },
            },
          },
        },
      },
    },
  });

  if (!application) {
    return { allowed: false, companyId: null, role: null };
  }

  const membership = application.job.company.members[0];
  if (!membership) {
    return { allowed: false, companyId: null, role: null };
  }

  const canEdit = membership.role === "ADMIN" || membership.role === "RECRUITER";

  return {
    allowed: true,
    companyId: application.job.companyId,
    role: membership.role,
    canEdit,
  };
}

/**
 * 获取会话并检查是否登录
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("未登录");
  }

  return session;
}