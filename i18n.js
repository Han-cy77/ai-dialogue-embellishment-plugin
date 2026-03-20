const I18n = {
  currentLocale: 'zh-CN',
  
  locales: {
    'zh-CN': {
      // Popup 界面
      popupTitle: 'AI 对话润色插件',
      popupSubtitle: '请输入 SiliconFlow API Key (支持免费开源模型)',
      apiKeyLabel: 'API Key',
      apiKeyPlaceholder: '请输入 SiliconFlow API Key',
      saveButton: '保存',
      saveSuccess: '保存成功！（已加密存储）',
      saveError: '加密失败，请重试',
      pleaseEnterApiKey: '请输入 API Key',
      
      // 语言选项
      languageLabel: '语言',
      
      // Content Script
      buttonDefault: '✨ 润色',
      buttonLoading: '⏳ 润色中...',
      noInputFound: '未找到输入框',
      pleaseInputDraft: '请输入草稿',
      requestFailed: '发送请求失败，请检查插件配置',
      embellishFailed: '润色失败，请稍后重试',
      pluginLoaded: 'AI 润色插件已加载',
      buttonInjected: '润色按钮已注入',
      embellishComplete: '润色完成，已回填文本',
      inputNotFound: '未找到输入框，将继续监听页面变化',
      
      // 错误信息
      apiKeyNotConfigured: '请先在插件弹窗中配置 API Key',
      apiKeyDecryptFailed: 'API Key 解密失败，请重新配置',
      apiReturnError: 'API 返回数据格式错误',
      httpError: 'HTTP error! status: ',
      
      // System Prompt for AI
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
      // Popup 界面
      popupTitle: 'AI Dialogue Embellishment Plugin',
      popupSubtitle: 'Enter SiliconFlow API Key (Free open-source models supported)',
      apiKeyLabel: 'API Key',
      apiKeyPlaceholder: 'Enter SiliconFlow API Key',
      saveButton: 'Save',
      saveSuccess: 'Saved! (Encrypted storage)',
      saveError: 'Encryption failed, please retry',
      pleaseEnterApiKey: 'Please enter API Key',
      
      // 语言选项
      languageLabel: 'Language',
      
      // Content Script
      buttonDefault: '✨ Embellish',
      buttonLoading: '⏳ Embellishing...',
      noInputFound: 'No input field found',
      pleaseInputDraft: 'Please enter a draft',
      requestFailed: 'Request failed, please check plugin configuration',
      embellishFailed: 'Embellishment failed, please retry later',
      pluginLoaded: 'AI Embellishment Plugin Loaded',
      buttonInjected: 'Embellish button injected',
      embellishComplete: 'Embellishment complete, text filled',
      inputNotFound: 'No input field found, will continue monitoring',
      
      // 错误信息
      apiKeyNotConfigured: 'Please configure API Key in popup',
      apiKeyDecryptFailed: 'API Key decryption failed, please reconfigure',
      apiReturnError: 'API returned invalid data format',
      httpError: 'HTTP error! status: ',
      
      // System Prompt for AI
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
  },
  
  // 获取当前语言
  getLocale() {
    return this.currentLocale;
  },
  
  // 设置语言
  setLocale(locale) {
    if (this.locales[locale]) {
      this.currentLocale = locale;
      return true;
    }
    return false;
  },
  
  // 获取翻译文本
  t(key) {
    const locale = this.locales[this.currentLocale];
    if (locale && locale[key]) {
      return locale[key];
    }
    // 如果找不到，尝试从默认语言获取
    const defaultLocale = this.locales['zh-CN'];
    if (defaultLocale && defaultLocale[key]) {
      return defaultLocale[key];
    }
    return key;
  },
  
  // 获取所有可用语言
  getAvailableLocales() {
    return Object.keys(this.locales).map(key => ({
      code: key,
      name: key === 'zh-CN' ? '中文' : 'English'
    }));
  }
};

// 快捷翻译函数
function t(key) {
  return I18n.t(key);
}
