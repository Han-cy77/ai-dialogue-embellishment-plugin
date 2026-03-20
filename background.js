importScripts('crypto.js');

// i18n 简版实现（Service Worker 无法访问 DOM，使用内联翻译）
const I18nMessages = {
  'zh-CN': {
    apiKeyNotConfigured: '请先在插件弹窗中配置 API Key',
    apiKeyDecryptFailed: 'API Key 解密失败，请重新配置',
    apiRequestFailed: 'API 请求失败: ',
    apiReturnError: 'API 返回数据格式错误',
    systemPrompt: `# Role: AI 提示词优化专家

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
  'en-US': {
    apiKeyNotConfigured: 'Please configure API Key in popup',
    apiKeyDecryptFailed: 'API Key decryption failed, please reconfigure',
    apiRequestFailed: 'API request failed: ',
    apiReturnError: 'API returned invalid data format',
    systemPrompt: `# Role: AI Prompt Optimization Expert

## Objective:
Your task is acting as an "intermediary". Users will input a brief, casual draft, and you need to expand it into a high-quality Prompt. This final Prompt is what users will send to ChatGPT/Claude and other large language models.

## Rules (Strictly Follow):
1. 【Core Forbidden】: NEVER directly answer the user's question! NEVER generate the final result (like writing an article or code directly)! You can ONLY output "prompts for asking questions".
2. Add Context: Set an appropriate expert role for the LLM and specify the format, tone, and requirements for the output.
3. Direct Output: Return the polished prompt directly. Do NOT include any filler like "Sure", "Here's the optimized prompt", etc.

## Examples (Few-Shot):

User Input: Help me write a resignation letter
Your Output: You are a senior HR expert who specializes in workplace communication and labor law. Please help me write a formal resignation letter.
Background: I am resigning due to personal career development plans and hope to leave on good terms.
Format Requirements:
1. Tone should be professional, sincere, and grateful.
2. Structure should include: clear resignation intent, expected last working day (leave blank for me to fill in), gratitude to the company and team, commitment to work handover.
3. Keep it around 300 words, suitable for sending as an email to your direct supervisor.

User Input: Write a snake game in Python
Your Output: You are a senior Python engineer with 10 years of experience. Please help me write a classic "Snake" game in Python.
Specific Requirements:
1. Use the pygame library for development.
2. Code should include complete Chinese comments explaining core logic (such as snake movement, food collision detection, wall collision detection).
3. Game should have a simple start screen and scoring system.
4. Please combine all code in a single file so I can copy and run it directly.`
  }
};

function t(key, locale = 'zh-CN') {
  const messages = I18nMessages[locale] || I18nMessages['zh-CN'];
  return messages[key] || key;
}

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
    chrome.storage.local.get(['encryptedApiKey', 'language'], async function(storage) {
      // 获取当前语言
      const currentLocale = storage.language || 'zh-CN';
      
      if (!storage.encryptedApiKey) {
        reject(new Error(t('apiKeyNotConfigured', currentLocale)));
        return;
      }
      
      const apiKey = await CryptoUtil.decrypt(storage.encryptedApiKey);
      if (!apiKey) {
        reject(new Error(t('apiKeyDecryptFailed', currentLocale)));
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
                content: t('systemPrompt', currentLocale)
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
          throw new Error(errorData.error?.message || t('apiRequestFailed', currentLocale) + response.status);
        }
        
        const responseData = await response.json();
        const embellishedText = responseData.choices?.[0]?.message?.content;
        
        if (!embellishedText) {
          throw new Error(t('apiReturnError', currentLocale));
        }
        
        resolve({ text: embellishedText });
      } catch (error) {
        reject(error);
      }
    });
  });
  
  return result;
}
