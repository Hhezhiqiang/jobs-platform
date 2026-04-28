/**
 * 使用 AI 解析职位描述，提取结构化信息
 */

interface ParsedJobDescription {
  description: string; // 岗位职责
  requirements: string; // 任职要求
  benefits: string; // 福利待遇
}

export async function parseJobDescriptionWithAI(
  rawDescription: string
): Promise<ParsedJobDescription> {
  const apiKey = process.env.KIMI_API_KEY;
  
  if (!apiKey) {
    // 如果没有 API Key，返回原始描述
    return {
      description: rawDescription,
      requirements: '',
      benefits: ''
    };
  }

  try {
    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [
          {
            role: 'system',
            content: `你是一个专业的职位描述解析器。请将原始的职位描述文本解析为结构化的三个部分：
1. 岗位职责 (description) - 该职位需要做什么
2. 任职要求 (requirements) - 需要什么技能、经验、学历
3. 福利待遇 (benefits) - 公司提供什么福利

如果原文中没有明确提到某个部分，就返回空字符串。
只返回 JSON 格式，不要其他内容。`
          },
          {
            role: 'user',
            content: `请解析以下职位描述：\n\n${rawDescription.substring(0, 3000)}`
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('AI 返回空内容');
    }

    const parsed = JSON.parse(content) as ParsedJobDescription;
    
    return {
      description: parsed.description || rawDescription.substring(0, 500),
      requirements: parsed.requirements || '',
      benefits: parsed.benefits || ''
    };
  } catch (error: any) {
    console.error('AI 解析失败:', error.message);
    // 失败时返回原始描述的前 500 字
    return {
      description: rawDescription.substring(0, 500),
      requirements: '',
      benefits: ''
    };
  }
}
