document.addEventListener('DOMContentLoaded', async function() {
  const apiKeyInput = document.getElementById('apiKey');
  const languageSelect = document.getElementById('languageSelect');
  const saveBtn = document.getElementById('saveBtn');
  const statusDiv = document.getElementById('status');

  // 初始化：加载保存的语言设置
  chrome.storage.local.get(['language', 'encryptedApiKey'], async function(result) {
    // 加载语言设置
    if (result.language) {
      I18n.setLocale(result.language);
    }
    
    // 应用翻译到界面
    applyTranslations();
    
    // 设置语言选择器的值
    languageSelect.value = I18n.getLocale();
    
    // 加载 API Key
    if (result.encryptedApiKey) {
      const decryptedKey = await CryptoUtil.decrypt(result.encryptedApiKey);
      if (decryptedKey) {
        apiKeyInput.value = decryptedKey;
      }
    }
  });

  // 语言切换事件
  languageSelect.addEventListener('change', async function() {
    const newLocale = languageSelect.value;
    I18n.setLocale(newLocale);
    
    // 保存语言设置
    chrome.storage.local.set({ language: newLocale });
    
    // 应用翻译
    applyTranslations();
  });

  // 保存按钮点击事件
  saveBtn.addEventListener('click', async function() {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      showStatus(I18n.t('pleaseEnterApiKey'), 'error');
      return;
    }
    
    try {
      const encryptedKey = await CryptoUtil.encrypt(apiKey);
      chrome.storage.local.set({ encryptedApiKey: encryptedKey }, function() {
        showStatus(I18n.t('saveSuccess'), 'success');
      });
    } catch (error) {
      console.error('Encryption failed:', error);
      showStatus(I18n.t('saveError'), 'error');
    }
  });

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + type;
    
    setTimeout(function() {
      statusDiv.textContent = '';
      statusDiv.className = 'status';
    }, 2000);
  }

  // 应用翻译到所有带有 data-i18n 属性的元素
  function applyTranslations() {
    // 翻译标题
    const title = document.querySelector('.header h1');
    if (title) {
      title.textContent = I18n.t('popupTitle');
    }
    
    // 翻译副标题
    const subtitle = document.querySelector('.header p');
    if (subtitle) {
      subtitle.textContent = I18n.t('popupSubtitle');
    }
    
    // 翻译所有带 data-i18n 属性的 label
    const labels = document.querySelectorAll('[data-i18n]');
    labels.forEach(function(label) {
      const key = label.getAttribute('data-i18n');
      if (key) {
        label.textContent = I18n.t(key);
      }
    });
    
    // 翻译所有带 data-i18n-placeholder 属性的输入框
    const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
    placeholders.forEach(function(input) {
      const key = input.getAttribute('data-i18n-placeholder');
      if (key) {
        input.placeholder = I18n.t(key);
      }
    });
    
    // 翻译保存按钮
    const saveButton = document.getElementById('saveBtn');
    if (saveButton) {
      saveButton.textContent = I18n.t('saveButton');
    }
  }
});
