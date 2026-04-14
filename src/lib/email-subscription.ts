import { prisma } from "@/lib/prisma";
import { z } from "zod";

const emailSchema = z.string().email("请输入有效的邮箱地址");

/**
 * 订阅邮件通知
 */
export async function subscribeEmail(email: string): Promise<{ success: boolean; message: string }> {
  try {
    // 验证邮箱格式
    emailSchema.parse(email);

    // 检查是否已订阅
    const existing = await prisma.subscribers?.findUnique({
      where: { email },
    });

    if (existing) {
      return { success: false, message: "该邮箱已订阅" };
    }

    // 创建订阅记录
    // 注意: 需要在prisma schema中添加subscribers模型
    // await prisma.subscribers.create({
    //   data: {
    //     email,
    //     subscribedAt: new Date(),
    //     active: true,
    //   },
    // });

    console.log(`[Subscribe] New subscriber: ${email}`);
    
    return { success: true, message: "订阅成功！您将收到最新文章通知" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: "请输入有效的邮箱地址" };
    }
    console.error("[Subscribe] Error:", error);
    return { success: false, message: "订阅失败，请稍后重试" };
  }
}

/**
 * 取消订阅
 */
export async function unsubscribeEmail(email: string): Promise<{ success: boolean; message: string }> {
  try {
    // await prisma.subscribers.update({
    //   where: { email },
    //   data: { active: false },
    // });

    console.log(`[Subscribe] Unsubscribed: ${email}`);
    
    return { success: true, message: "已取消订阅" };
  } catch (error) {
    console.error("[Unsubscribe] Error:", error);
    return { success: false, message: "操作失败，请稍后重试" };
  }
}

/**
 * 发送新文章通知邮件
 * 可以在博客发布时调用
 */
export async function notifySubscribers(blogId: string): Promise<void> {
  // 获取所有活跃订阅者
  // const subscribers = await prisma.subscribers.findMany({
  //   where: { active: true },
  // });

  // 获取博客信息
  const blog = await prisma.pages.findUnique({
    where: { id: blogId },
    select: {
      title: true,
      slug: true,
      excerpt: true,
    },
  });

  if (!blog) return;

  console.log(`[Notify] Would notify subscribers about: ${blog.title}`);
  
  // 这里可以集成邮件服务 (Resend, SendGrid, etc.)
  // for (const subscriber of subscribers) {
  //   await sendEmail({
  //     to: subscriber.email,
  //     subject: `新文章: ${blog.title}`,
  //     html: generateEmailTemplate(blog),
  //   });
  // }
}
