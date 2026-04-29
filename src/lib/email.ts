import nodemailer from "nodemailer";

/**
 * HTML 转义用户输入，防止 XSS
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * 转义 URL，防止 href 注入
 */
function escapeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {
    // Invalid URL, escape it
  }
  return escapeHtml(url);
}

// 检查邮件配置是否完整
const isEmailConfigured = () => {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
};

// 创建邮件传输器
const createTransporter = () => {
  if (!isEmailConfigured()) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * 发送邮件
 */
export async function sendEmail({ to, subject, html, text }: SendEmailParams) {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      if (process.env.NODE_ENV === "development") {
         
        console.warn("Email not configured, skipping email send");
      }
      return { success: false, error: "Email not configured" };
    }

    const from = process.env.SMTP_FROM || `"招聘平台" <${process.env.SMTP_USER}>`;

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });

    if (process.env.NODE_ENV === "development") {
       
      console.log("Email sent:", info.messageId);
    }
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Send email error:", error);
    return { success: false, error };
  }
}

interface SendNotificationEmailParams {
  to: string;
  userName: string;
  notificationType: string;
  title: string;
  content: string;
  actionUrl?: string;
  actionText?: string;
}

/**
 * 发送通知邮件
 */
export async function sendNotificationEmail({
  to,
  userName,
  notificationType,
  title,
  content,
  actionUrl,
  actionText = "查看详情",
}: SendNotificationEmailParams) {
  const typeLabels: Record<string, string> = {
    APPLICATION_UPDATE: "申请状态更新",
    INTERVIEW_INVITE: "面试邀请",
    OFFER_RECEIVED: "录用通知",
    JOB_ALERT: "职位推荐",
    SYSTEM: "系统通知",
  };

  const typeLabel = typeLabels[notificationType] || "新通知";
  const subject = `${typeLabel}: ${title}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          background-color: #ffffff;
          border-radius: 8px;
          padding: 40px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e5e7eb;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 10px;
        }
        .type-label {
          display: inline-block;
          background-color: #dbeafe;
          color: #2563eb;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 20px;
        }
        .title {
          font-size: 24px;
          font-weight: bold;
          color: #111827;
          margin-bottom: 20px;
        }
        .content {
          color: #4b5563;
          font-size: 16px;
          line-height: 1.8;
          margin-bottom: 30px;
        }
        .button {
          display: inline-block;
          background-color: #2563eb;
          color: #ffffff;
          padding: 12px 32px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
          margin: 20px 0;
        }
        .button:hover {
          background-color: #1d4ed8;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #9ca3af;
          font-size: 14px;
        }
        .footer a {
          color: #2563eb;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">招聘平台</div>
        </div>
        
        <div class="type-label">${escapeHtml(typeLabel)}</div>
        
        <h1 class="title">${escapeHtml(title)}</h1>
        
        <p>${userName ? `您好，${escapeHtml(userName)}！` : "您好！"}</p>
        
        <div class="content">
          <p>${escapeHtml(content)}</p>
        </div>
        
        ${
          actionUrl
            ? `<a href="${escapeUrl(actionUrl)}" class="button">${escapeHtml(actionText)}</a>`
            : ""
        }
        
        <div class="footer">
          <p>此邮件由系统自动发送，请勿直接回复。</p>
          <p>如需帮助，请访问 <a href="${escapeUrl(process.env.NEXT_PUBLIC_APP_URL || "#")}">招聘平台</a></p>
          <p>© ${new Date().getFullYear()} 招聘平台 版权所有</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
${escapeHtml(typeLabel)}: ${escapeHtml(title)}

您好${userName ? `，${escapeHtml(userName)}` : ""}！

${escapeHtml(content)}

${actionUrl ? `点击查看详情：${escapeUrl(actionUrl)}` : ""}

此邮件由系统自动发送，请勿直接回复。
© ${new Date().getFullYear()} 招聘平台 版权所有
  `;

  return sendEmail({ to, subject, html, text });
}

/**
 * 检查邮件服务是否可用
 */
export function isEmailServiceAvailable() {
  return isEmailConfigured();
}