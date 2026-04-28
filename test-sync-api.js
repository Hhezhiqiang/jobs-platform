// 测试同步 API
const KIMI_API_KEY = process.env.KIMI_API_KEY || "sk-yBaN30XiLcyh4ZkVd7aLMukglXD6P9RSwC9nXCPhjQq3h3Ke";
const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID || "2899dccd";
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY || "86ffc0dcf27cad6c95088854de203aed";

async function testSync() {
  console.log('=== 测试 Adzuna 同步 ===\n');
  
  // 1. 测试 Adzuna API
  console.log('1️⃣ 测试 Adzuna API...');
  const adzunaRes = await fetch(`https://api.adzuna.com/v1/api/jobs/gb/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&what=software%20engineer&where=London&results_per_page=10`);
  const adzunaData = await adzunaRes.json();
  console.log(`   ✅ Adzuna API 正常`);
  console.log(`   职位数：${adzunaData.count}`);
  console.log(`   返回：${adzunaData.results?.length} 个\n`);
  
  // 2. 测试 Kimi API 解析
  console.log('2️⃣ 测试 Kimi AI 解析...');
  const sampleDesc = adzunaData.results[0].description?.substring(0, 500) || '';
  const kimiRes = await fetch('https://api.moonshot.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KIMI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'moonshot-v1-8k',
      messages: [
        { role: 'system', content: '你是一个专业的职位描述解析器。请将原始的职位描述文本解析为结构化的三个部分：1. 岗位职责 2. 任职要求 3. 福利待遇。如果原文中没有明确提到某个部分，就返回空字符串。只返回 JSON 格式，不要其他内容。' },
        { role: 'user', content: `请解析以下职位描述：\n\n${sampleDesc}` }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })
  });
  
  if (!kimiRes.ok) {
    console.log(`   ❌ Kimi API 错误：${kimiRes.status}`);
    console.log(`   响应：${await kimiRes.text()}\n`);
  } else {
    const kimiData = await kimiRes.json();
    const content = kimiData.choices?.[0]?.message?.content;
    console.log(`   ✅ Kimi API 正常`);
    console.log(`   解析结果长度：${content?.length || 0} 字符\n`);
  }
  
  // 3. 测试从描述中提取直接链接
  console.log('3️⃣ 测试提取直接链接...');
  const job = adzunaData.results[0];
  const urlMatch = job.description.match(/(https?:\/\/[^\s<>"']+)/i);
  if (urlMatch && urlMatch[1] && !urlMatch[1].includes('adzuna.com')) {
    console.log(`   ✅ 找到直接链接：${urlMatch[1]}`);
  } else {
    console.log(`   ⚠️ 未找到直接链接，将使用 Adzuna 链接`);
    console.log(`   Adzuna 链接：${job.redirect_url}`);
  }
  
  console.log('\n✅ 测试完成！');
}

testSync().catch(err => console.error('测试失败：', err));
