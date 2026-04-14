/**
 * SEO 推送工具
 * 支持 Google Indexing API、Bing IndexNow、百度站长平台
 */

interface PushResult {
  engine: string;
  success: boolean;
  message?: string;
}

export async function pushToSearchEngines(url: string): Promise<PushResult[]> {
  const results: PushResult[] = [];

  // 1. Bing IndexNow（最简单，无需认证）
  try {
    const bingRes = await fetch(
      `https://www.bing.com/indexnow?url=${encodeURIComponent(url)}`,
      { method: "GET", signal: AbortSignal.timeout(10000) }
    );
    results.push({
      engine: "Bing",
      success: bingRes.ok,
      message: bingRes.ok ? "已提交" : `HTTP ${bingRes.status}`,
    });
  } catch (e) {
    results.push({ engine: "Bing", success: false, message: String(e) });
  }

  // 2. Google Indexing API（需要 GOOGLE_SERVICE_ACCOUNT_JSON 配置）
  const googleAccount = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (googleAccount) {
    try {
      // 动态导入 Google Auth 库（避免未配置时的依赖问题）
      const { JWT } = await import("google-auth-library");
      const credentials = JSON.parse(googleAccount);
      
      const client = new JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ["https://www.googleapis.com/auth/indexing"],
      });

      const accessToken = await client.authorize();
      const googleRes = await fetch(
        "https://indexing.googleapis.com/v3/urlNotifications:publish",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken.access_token}`,
          },
          body: JSON.stringify({
            url,
            type: "URL_UPDATED",
          }),
          signal: AbortSignal.timeout(15000),
        }
      );

      results.push({
        engine: "Google",
        success: googleRes.ok,
        message: googleRes.ok ? "已提交索引" : `HTTP ${googleRes.status}`,
      });
    } catch (e) {
      results.push({ engine: "Google", success: false, message: String(e) });
    }
  } else {
    results.push({
      engine: "Google",
      success: false,
      message: "未配置 GOOGLE_SERVICE_ACCOUNT_JSON",
    });
  }

  // 3. 百度站长推送（需要 BAIDU_SITE_TOKEN 配置）
  const baiduToken = process.env.BAIDU_SITE_TOKEN;
  if (baiduToken) {
    try {
      const baiduRes = await fetch(
        `http://data.zz.baidu.com/urls?site=${encodeURIComponent(getSiteDomain(url))}&token=${baiduToken}`,
        {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: url,
          signal: AbortSignal.timeout(10000),
        }
      );
      results.push({
        engine: "Baidu",
        success: baiduRes.ok,
        message: baiduRes.ok ? "已提交" : `HTTP ${baiduRes.status}`,
      });
    } catch (e) {
      results.push({ engine: "Baidu", success: false, message: String(e) });
    }
  } else {
    results.push({
      engine: "Baidu",
      success: false,
      message: "未配置 BAIDU_SITE_TOKEN",
    });
  }

  return results;
}

function getSiteDomain(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return url;
  }
}

// CLI 入口
async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error("用法: npx tsx scripts/seo-push.ts <URL>");
    process.exit(1);
  }

  console.log(`正在推送: ${url}`);
  const results = await pushToSearchEngines(url);
  
  for (const result of results) {
    const icon = result.success ? "✅" : "❌";
    console.log(`${icon} ${result.engine}: ${result.message}`);
  }
}

if (require.main === module) {
  main();
}
