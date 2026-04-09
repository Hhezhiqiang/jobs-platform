# 搜索引擎提交指南

> 完成 SEO 基础优化后，需要主动提交网站给各大搜索引擎，加速收录。

---

## 一、Google Search Console（最重要）

### 1. 添加网站
1. 访问 https://search.google.com/search-console
2. 点击 "添加资源"
3. 选择 "网址前缀" 并输入：`https://jobs-platform-gold.vercel.app`
4. 选择验证方式（推荐 HTML 标签）

### 2. 验证网站所有权

**方式A：HTML 标签（推荐）**
```html
<!-- 添加到 src/app/layout.tsx 的 <head> 中 -->
<meta name="google-site-verification" content="YOUR_CODE" />
```

**方式B：DNS 验证**
在域名管理后台添加 TXT 记录：
```
名称：@
值：google-site-verification=YOUR_CODE
```

### 3. 提交 Sitemap
1. 进入 Search Console → 站点地图
2. 输入：`sitemap.xml`
3. 点击提交

### 4. 请求索引
1. 进入 "网址检查" 工具
2. 输入首页 URL
3. 点击 "请求编入索引"

---

## 二、Bing Webmaster Tools

### 1. 添加网站
1. 访问 https://www.bing.com/webmasters
2. 登录 Microsoft 账号
3. 点击 "添加网站"
4. 输入：`https://jobs-platform-gold.vercel.app`

### 2. 验证网站
选择 HTML 文件验证或 Meta 标签验证。

**Meta 标签方式：**
```html
<meta name="msvalidate.01" content="YOUR_CODE" />
```

### 3. 提交 Sitemap
1. 进入 "Sitemaps"
2. 输入完整 URL：`https://jobs-platform-gold.vercel.app/sitemap.xml`
3. 点击提交

### 4. 开启 IndexNow（推荐）
Bing 支持 IndexNow 协议，可以实时推送新内容。

---

## 三、百度搜索资源平台

### 1. 注册与添加
1. 访问 https://ziyuan.baidu.com
2. 登录百度账号
3. 点击 "用户中心" → "站点管理" → "添加网站"
4. 输入：`https://jobs-platform-gold.vercel.app`

### 2. 验证网站
**推荐方式：HTML 标签验证**
```html
<meta name="baidu-site-verification" content="YOUR_CODE" />
```

### 3. 提交 Sitemap
1. 进入 "资源提交" → "Sitemap"
2. 输入：`https://jobs-platform-gold.vercel.app/sitemap.xml`

### 4. 自动推送（强烈推荐）
在页面中添加百度自动推送代码：
```javascript
<script>
(function(){
    var bp = document.createElement('script');
    var curProtocol = window.location.protocol.split(':')[0];
    if (curProtocol === 'https') {
        bp.src = 'https://zz.bdstatic.com/linksubmit/push.js';
    } else {
        bp.src = 'http://push.zhanzhang.baidu.com/push.js';
    }
    var s = document.getElementsByTagName("script")[0];
    s.parentNode.insertBefore(bp, s);
})();
</script>
```

---

## 四、360 搜索站长平台

1. 访问 http://zhanzhang.so.com
2. 添加网站并验证
3. 提交 Sitemap

验证代码：
```html
<meta name="360-site-verification" content="YOUR_CODE" />
```

---

## 五、搜狗搜索

1. 访问 http://zhanzhang.sogou.com
2. 添加网站并验证
3. 提交 Sitemap

验证代码：
```html
<meta name="sogou_site_verification" content="YOUR_CODE" />
```

---

## 六、快速提交清单

### 立即执行（今天）
- [ ] Google Search Console 添加网站
- [ ] Bing Webmaster Tools 添加网站
- [ ] 提交 Sitemap 到 Google
- [ ] 提交 Sitemap 到 Bing

### 本周完成
- [ ] 百度搜索资源平台添加
- [ ] 百度自动推送代码部署
- [ ] 360 搜索站长平台
- [ ] 搜狗站长平台

### 持续监控
- [ ] 每周查看 Search Console 数据
- [ ] 监控索引状态和抓取错误
- [ ] 分析搜索查询和点击率

---

## 七、验证部署效果

### 检查 robots.txt
访问：
```
https://jobs-platform-gold.vercel.app/robots.txt
```

预期输出：
```
User-agent: *
Allow: /
Sitemap: https://jobs-platform-gold.vercel.app/sitemap.xml
```

### 检查 Sitemap
访问：
```
https://jobs-platform-gold.vercel.app/sitemap.xml
```

应该看到 XML 格式的网址列表。

### 检查 Meta 标签
查看页面源码，确认包含：
```html
<meta name="google-site-verification" content="..." />
<meta name="baidu-site-verification" content="..." />
```

---

## 八、收录时间预估

| 搜索引擎 | 首次收录 | 完整收录 |
|---------|---------|---------|
| Google | 1-3 天 | 1-2 周 |
| Bing | 1-7 天 | 2-4 周 |
| 百度 | 7-30 天 | 1-2 月 |
| 360 | 7-14 天 | 2-4 周 |
| 搜狗 | 7-14 天 | 2-4 周 |

---

## 九、加速收录技巧

1. **高质量外链**: 在高权重网站发布链接
2. **社交媒体**: 在微博、知乎分享网站链接
3. **内容更新**: 保持每天更新（博客自动化已配置）
4. **内链优化**: 确保所有页面都能通过链接访问
5. **性能优化**: 提升页面加载速度

---

**下一步：获取各搜索引擎的验证代码并添加到网站中。**
