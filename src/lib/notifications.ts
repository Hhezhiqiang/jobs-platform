import { prisma } from "./prisma";
import { NotificationType } from "@prisma/client";
import { sendNotificationEmail } from "./email";
import { logger } from '@/lib/logger';

// 定义元数据值的类型
export type NotificationMetadataValue = string | number | boolean | null | undefined;

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  metadata?: Record<string, NotificationMetadataValue>;
  sendEmail?: boolean; // 是否发送邮件通知
}

/**
 * 创建通知
 */
export async function createNotification({
  userId,
  type,
  title,
  content,
  metadata,
  sendEmail: shouldSendEmail,
}: CreateNotificationParams) {
  try {
    const notification = await prisma.notifications.create({
      data: {
        userId,
        type,
        title,
        content,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadata: metadata as Record<string, any> || undefined,
        isRead: false,
      },
    });

    // 如果需要发送邮件通知
    if (shouldSendEmail) {
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });

      if (user?.email) {
        let actionUrl;
        if (metadata?.applicationId) {
          actionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/applications`;
        } else if (metadata?.jobId) {
          actionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/jobs/${metadata.jobId}`;
        }

        // 异步发送邮件，不阻塞通知创建
        sendNotificationEmail({
          to: user.email,
          userName: user.name || "",
          notificationType: type,
          title,
          content,
          actionUrl,
        }).catch((error: Error) => {
          logger.error("Failed to send notification email:", error);
        });
      }
    }

    return notification;
  } catch (error) {
    logger.error("Create notification error:", error);
    throw error;
  }
}

/**
 * 批量创建通知
 */
export async function createNotifications(
  notifications: CreateNotificationParams[]
) {
  try {
    const result = await prisma.notifications.createMany({
      data: notifications.map((n) => ({
        userId: n.userId,
        type: n.type,
        title: n.title,
        content: n.content,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadata: n.metadata as Record<string, any> || undefined,
        isRead: false,
      })),
    });

    return result;
  } catch (error) {
    logger.error("Create notifications error:", error);
    throw error;
  }
}

/**
 * 根据职位申请状态变更创建通知
 */
export async function createApplicationStatusNotification(
  userId: string,
  applicationId: string,
  jobTitle: string,
  companyName: string,
  oldStatus: string,
  newStatus: string,
  sendEmail: boolean = true
) {
  const statusMap: Record<string, { title: string; content: string; type: NotificationType }> = {
    VIEWED: {
      title: "申请已被查看",
      content: `您申请的 "${jobTitle}" 职位（${companyName}）已被招聘方查看`,
      type: "APPLICATION_UPDATE",
    },
    INTERVIEW: {
      title: "面试邀请",
      content: `恭喜！您申请的 "${jobTitle}" 职位（${companyName}）已进入面试环节`,
      type: "INTERVIEW_INVITE",
    },
    OFFER: {
      title: "收到录用通知",
      content: `恭喜！您申请的 "${jobTitle}" 职位（${companyName}）已发放录用通知`,
      type: "OFFER_RECEIVED",
    },
    REJECTED: {
      title: "申请状态更新",
      content: `很遗憾，您申请的 "${jobTitle}" 职位（${companyName}）未被录用`,
      type: "APPLICATION_UPDATE",
    },
  };

  const statusInfo = statusMap[newStatus];
  if (!statusInfo) return null;

  return createNotification({
    userId,
    type: statusInfo.type,
    title: statusInfo.title,
    content: statusInfo.content,
    metadata: {
      applicationId,
      jobTitle,
      companyName,
      oldStatus,
      newStatus,
    },
    sendEmail,
  });
}

/**
 * 创建系统通知
 */
export async function createSystemNotification(
  userId: string,
  title: string,
  content: string,
  metadata?: Record<string, NotificationMetadataValue>
) {
  return createNotification({
    userId,
    type: "SYSTEM",
    title,
    content,
    metadata,
  });
}

/**
 * 创建职位提醒通知
 */
export async function createJobAlertNotification(
  userId: string,
  jobTitle: string,
  companyName: string,
  jobId: string,
  metadata?: Record<string, NotificationMetadataValue>
) {
  return createNotification({
    userId,
    type: "JOB_ALERT",
    title: "新职位推荐",
    content: `发现新职位："${jobTitle}"（${companyName}），快来看看是否符合您的期望`,
    metadata: {
      jobId,
      jobTitle,
      companyName,
      ...metadata,
    },
  });
}

/**
 * 获取用户未读通知数量
 */
export async function getUnreadNotificationCount(userId: string) {
  try {
    const count = await prisma.notifications.count({
      where: {
        userId,
        isRead: false,
      },
    });
    return count;
  } catch (error) {
    logger.error("Get unread notification count error:", error);
    return 0;
  }
}
