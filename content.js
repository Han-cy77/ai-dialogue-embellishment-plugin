(function() {
  'use strict';

  const BUTTON_ID = 'ai-embellish-btn';
  const SITE_CONFIGS = [
    {
      name: 'doubao',
      hosts: ['www.doubao.com', 'doubao.com'],
      selectors: [
        'textarea',
        'div[contenteditable="true"][role="textbox"]',
        'div[contenteditable="true"]'
      ]
    },
    {
      name: 'deepseek',
      hosts: ['chat.deepseek.com', 'www.deepseek.com', 'deepseek.com'],
      selectors: [
        'textarea',
        'div[contenteditable="true"][role="textbox"]',
        'div[contenteditable="true"]'
      ]
    },
    {
      name: 'yuanbao',
      hosts: ['yuanbao.tencent.com'],
      selectors: [
        'textarea',
        'div[contenteditable="true"][role="textbox"]',
        'div[contenteditable="true"]'
      ]
    },
    {
      name: 'general-ai-chat',
      hosts: [
        'chatgpt.com',
        'chat.openai.com',
        'claude.ai',
        'gemini.google.com',
        'copilot.microsoft.com',
        'chatglm.cn',
        'www.kimi.com',
        'kimi.moonshot.cn',
        'qwen.ai',
        'chat.qwen.ai',
        'yiyan.baidu.com',
        'xinghuo.xfyun.cn'
      ],
      selectors: [
        'textarea',
        'div[contenteditable="true"][role="textbox"]',
        'div[contenteditable="true"]'
      ]
    }
  ];
  const GENERIC_SELECTORS = [
    'textarea',
    'input[type="text"]',
    'input[type="search"]',
    'div[contenteditable="true"][role="textbox"]',
    'div[contenteditable="true"]'
  ];

  let currentInputElement = null;
  let embellishButton = null;
  let observer = null;
  let rafId = null;
  let buttonTextDefault = '润色';
  let buttonTextLoading = '润色中...';

  function initI18n() {
    chrome.storage.local.get(['language'], function(result) {
      if (typeof I18n !== 'undefined' && result.language) {
        I18n.setLocale(result.language);
      }

      updateButtonTexts();

      if (typeof I18n !== 'undefined') {
        console.log(I18n.t('pluginLoaded'));
      }
    });
  }

  function getMessage(key, fallback) {
    if (typeof I18n !== 'undefined') {
      return I18n.t(key);
    }

    return fallback;
  }

  function updateButtonTexts() {
    buttonTextDefault = getMessage('buttonDefault', '润色');
    buttonTextLoading = getMessage('buttonLoading', '润色中...');

    if (embellishButton && !embellishButton.classList.contains('loading')) {
      embellishButton.textContent = buttonTextDefault;
    }
  }

  function isVisible(element) {
    if (!element || !element.isConnected) {
      return false;
    }

    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return false;
    }

    const style = window.getComputedStyle(element);
    return style.visibility !== 'hidden' && style.display !== 'none';
  }

  function isEditableElement(element) {
    if (!element || !isVisible(element) || element.disabled || element.readOnly) {
      return false;
    }

    if (element.matches('textarea')) {
      return true;
    }

    if (element.matches('input')) {
      const type = (element.getAttribute('type') || 'text').toLowerCase();
      return ['text', 'search'].includes(type);
    }

    return element.getAttribute('contenteditable') === 'true';
  }

  function getSiteSelectors() {
    const host = window.location.hostname;
    const siteConfig = SITE_CONFIGS.find((config) => config.hosts.includes(host));
    return siteConfig ? siteConfig.selectors : [];
  }

  function getFocusedEditable() {
    const activeElement = document.activeElement;
    if (isEditableElement(activeElement)) {
      return activeElement;
    }

    const nearestEditable = activeElement && activeElement.closest
      ? activeElement.closest('textarea, input[type="text"], input[type="search"], div[contenteditable="true"]')
      : null;

    return isEditableElement(nearestEditable) ? nearestEditable : null;
  }

  function findInputElement() {
    const focusedEditable = getFocusedEditable();
    if (focusedEditable) {
      return focusedEditable;
    }

    const selectors = [...getSiteSelectors(), ...GENERIC_SELECTORS];
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        if (isEditableElement(element)) {
          return element;
        }
      }
    }

    return null;
  }

  function getInputContent(element) {
    if (!element) {
      return '';
    }

    if (element.matches('textarea, input')) {
      return element.value.trim();
    }

    return (element.innerText || element.textContent || '').trim();
  }

  function setContentEditableText(element, content) {
    element.focus();

    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      range.selectNodeContents(element);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    const inserted = document.execCommand && document.execCommand('insertText', false, content);
    if (!inserted) {
      element.innerHTML = '';
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (index > 0) {
          element.appendChild(document.createElement('br'));
        }
        element.appendChild(document.createTextNode(line));
      });
    }
  }

  function setInputContent(element, content) {
    if (!element) {
      return;
    }

    if (element.matches('textarea, input')) {
      const prototype = element.tagName === 'TEXTAREA'
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype;
      const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

      if (valueSetter) {
        valueSetter.call(element, content);
      } else {
        element.value = content;
      }
    } else if (element.getAttribute('contenteditable') === 'true') {
      setContentEditableText(element, content);
    }

    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: content
    }));
  }

  function createEmbellishButton() {
    const existingButton = document.getElementById(BUTTON_ID);
    if (existingButton) {
      return existingButton;
    }

    const button = document.createElement('button');
    button.id = BUTTON_ID;
    button.className = 'ai-embellish-btn';
    button.type = 'button';
    button.textContent = buttonTextDefault;
    button.addEventListener('click', handleEmbellishClick);
    document.body.appendChild(button);

    return button;
  }

  function positionButton(inputElement, button) {
    if (!inputElement || !button || !isVisible(inputElement)) {
      if (button) {
        button.style.display = 'none';
      }
      return;
    }

    button.style.display = 'block';
    button.style.position = 'fixed';

    const rect = inputElement.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    const margin = 8;
    const left = Math.min(
      window.innerWidth - buttonRect.width - margin,
      Math.max(margin, rect.right - buttonRect.width)
    );
    const top = Math.min(
      window.innerHeight - buttonRect.height - margin,
      Math.max(margin, rect.bottom + margin)
    );

    button.style.left = `${left}px`;
    button.style.top = `${top}px`;
  }

  function updateButtonPosition() {
    if (!embellishButton) {
      return;
    }

    if (!currentInputElement || !currentInputElement.isConnected) {
      currentInputElement = findInputElement();
    }

    positionButton(currentInputElement, embellishButton);
  }

  function schedulePositionUpdate() {
    if (rafId !== null) {
      return;
    }

    rafId = window.requestAnimationFrame(() => {
      rafId = null;
      updateButtonPosition();
    });
  }

  function injectButton(inputElement) {
    if (!inputElement || !isEditableElement(inputElement)) {
      return;
    }

    currentInputElement = inputElement;
    embellishButton = createEmbellishButton();
    schedulePositionUpdate();
  }

  function setLoadingState(isLoading) {
    if (!embellishButton) {
      return;
    }

    embellishButton.textContent = isLoading ? buttonTextLoading : buttonTextDefault;
    embellishButton.classList.toggle('loading', isLoading);
  }

  function handleEmbellishClick(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!currentInputElement || !currentInputElement.isConnected) {
      currentInputElement = findInputElement();
    }

    if (!currentInputElement) {
      alert(getMessage('inputNotFound', '未找到可用的输入框'));
      return;
    }

    const content = getInputContent(currentInputElement);
    if (!content) {
      alert(getMessage('inputRequired', '请先输入需要润色的内容'));
      return;
    }

    setLoadingState(true);

    chrome.runtime.sendMessage(
      {
        action: 'embellish_text',
        data: { text: content }
      },
      function(response) {
        setLoadingState(false);

        if (chrome.runtime.lastError) {
          console.error('Failed to send message', chrome.runtime.lastError);
          alert(getMessage('requestFailed', '发送请求失败，请检查插件配置'));
          return;
        }

        if (response && response.success) {
          const embellishedText = response.data?.text || response.data;
          if (embellishedText) {
            setInputContent(currentInputElement, embellishedText);
            schedulePositionUpdate();
          }
          return;
        }

        alert(response?.error || getMessage('embellishFailed', '润色失败，请稍后重试'));
      }
    );
  }

  function setupMutationObserver() {
    if (observer) {
      observer.disconnect();
    }

    observer = new MutationObserver(() => {
      const inputElement = findInputElement();
      if (inputElement) {
        injectButton(inputElement);
      } else if (embellishButton) {
        embellishButton.style.display = 'none';
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'hidden', 'contenteditable']
    });
  }

  function bindFocusTracking() {
    document.addEventListener('focusin', (event) => {
      const target = event.target;
      const inputElement = isEditableElement(target)
        ? target
        : target && target.closest
          ? target.closest('textarea, input[type="text"], input[type="search"], div[contenteditable="true"]')
          : null;

      if (isEditableElement(inputElement)) {
        injectButton(inputElement);
      }
    });
  }

  function init() {
    initI18n();
    embellishButton = createEmbellishButton();
    injectButton(findInputElement());
    setupMutationObserver();
    bindFocusTracking();

    window.addEventListener('resize', schedulePositionUpdate);
    window.addEventListener('scroll', schedulePositionUpdate, true);

    chrome.storage.onChanged.addListener(function(changes) {
      if (changes.language && changes.language.newValue && typeof I18n !== 'undefined') {
        I18n.setLocale(changes.language.newValue);
        updateButtonTexts();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
