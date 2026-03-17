importScripts('crypto.js');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'sendRequest') {
    handleApiRequest(request.data)
      .then(response => sendResponse({ success: true, data: response }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (request.action === 'embellish_text') {
    handleEmbellishRequest(request.data)
      .then(response => sendResponse({ success: true, data: response }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

async function handleApiRequest(data) {
  const { apiKey, url, options } = data;
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    ...options.headers
  };

  const response = await fetch(url, {
    method: options.method || 'POST',
    headers: headers,
    body: JSON.stringify(options.body)
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

async function handleEmbellishRequest(data) {
  const { text } = data;
  
  const result = await new Promise((resolve, reject) => {
    chrome.storage.local.get(['encryptedApiKey'], async function(result) {
      if (!result.encryptedApiKey) {
        reject(new Error('请先在插件弹窗中配置 API Key'));
        return;
      }
      
      const apiKey = await CryptoUtil.decrypt(result.encryptedApiKey);
      if (!apiKey) {
        reject(new Error('API Key 解密失败，请重新配置'));
        return;
      }
      
      try {
        const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'Qwen/Qwen2.5-7B-Instruct',
            messages: [
              {
                role: 'system',
                content: `# Role: AI 提示词优化专家

## Objective:
你的任务是作为一个"中介"。用户会输入一句简短、随意的草稿，你要把它扩写成一段高质量的 Prompt（提示词）。这段最终的 Prompt 是用户要拿去发给 ChatGPT/Claude 等大模型用的。

## Rules (严格遵守):
1. 【核心禁忌】：绝对不要直接回答用户的问题！绝对不要替用户生成最终结果（如不要直接写文章、不要直接写代码）！你只能输出"用于提问的提示词"。
2. 补全上下文：为大模型设定恰当的专家角色，并明确输出的格式、语气和要求。
3. 直接输出：直接返回润色后的提示词，禁止包含"好的"、"这是优化后的提示词"等任何废话。

## 示例 (Few-Shot):

用户输入：帮我生成一份离职报告
你的输出：你现在是一位精通职场沟通与劳动法的资深HR专家。请帮我撰写一份正式的离职报告。
背景信息：我因个人职业发展规划原因决定离职，希望和平分手。
格式要求：
1. 语气专业、诚恳、感恩。
2. 结构包含：明确的离职意向、预计的最后工作日（留出空白让我填写）、对公司和团队的感谢、工作交接的承诺。
3. 字数控制在300字左右，适合作为邮件发送给直属领导。

用户输入：用python写个贪吃蛇
你的输出：你是一位拥有10年经验的Python高级工程师。请帮我用Python编写一个经典的"贪吃蛇"游戏。
具体要求：
1. 使用 pygame 库进行开发。
2. 代码需要包含完整的中文注释，解释核心逻辑（如蛇的移动、吃食物判定、撞墙判定）。
3. 游戏需要有简单的开始界面和计分系统。
4. 请将所有代码整合在一个文件中，确保我可以直接复制运行。`
              },
              {
                role: 'user',
                content: `${text}`
              }
            ],
            temperature: 0.7,
            max_tokens: 1000
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `API 请求失败: ${response.status}`);
        }
        
        const responseData = await response.json();
        const embellishedText = responseData.choices?.[0]?.message?.content;
        
        if (!embellishedText) {
          throw new Error('API 返回数据格式错误');
        }
        
        resolve({ text: embellishedText });
      } catch (error) {
        reject(error);
      }
    });
  });
  
  return result;
}
