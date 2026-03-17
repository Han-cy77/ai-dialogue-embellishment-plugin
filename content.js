(function() {
  'use strict';
  
  console.log('AI 润色插件已加载');

  const BUTTON_ID = 'ai-embellish-btn';
  const BUTTON_TEXT_DEFAULT = '✨ 润色';
  const BUTTON_TEXT_LOADING = '⏳ 润色中...';
  
  let currentInputElement = null;
  let embellishButton = null;
  let observer = null;

  function findInputElement() {
    const selectors = [
      'textarea[placeholder*="Message"]',
      'textarea[placeholder*="消息"]',
      'textarea[placeholder*="输入"]',
      'textarea[placeholder*="Ask"]',
      'textarea[placeholder*="Send"]',
      'div[contenteditable="true"]',
      'textarea'
    ];
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const rect = element.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const style = window.getComputedStyle(element);
          if (style.visibility !== 'hidden' && style.display !== 'none') {
            return element;
          }
        }
      }
    }
    return null;
  }

  function getInputContent(element) {
    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
      return element.value.trim();
    } else if (element.getAttribute('contenteditable') === 'true') {
      return element.innerText.trim() || element.textContent.trim();
    }
    return '';
  }

  function setInputContent(element, content) {
    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
      element.value = content;
    } else if (element.getAttribute('contenteditable') === 'true') {
      element.innerText = content;
    }
    
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    
    const inputEvent = new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: content
    });
    element.dispatchEvent(inputEvent);
  }

  function createEmbellishButton() {
    if (document.getElementById(BUTTON_ID)) {
      return document.getElementById(BUTTON_ID);
    }
    
    const button = document.createElement('button');
    button.id = BUTTON_ID;
    button.className = 'ai-embellish-btn';
    button.textContent = BUTTON_TEXT_DEFAULT;
    
    button.addEventListener('click', handleEmbellishClick);
    
    return button;
  }

  function positionButton(inputElement, button) {
    const rect = inputElement.getBoundingClientRect();
    
    let container = inputElement.parentElement;
    while (container && window.getComputedStyle(container).position === 'static' && container !== document.body) {
      container = container.parentElement;
    }
    
    if (!container || container === document.body) {
      container = document.body;
    }
    
    const containerRect = container.getBoundingClientRect();
    
    button.style.position = 'absolute';
    button.style.right = `${window.innerWidth - rect.right + 8}px`;
    button.style.bottom = `${window.innerHeight - rect.bottom + 8}px`;
    
    document.body.appendChild(button);
  }

  function injectButton(inputElement) {
    if (!inputElement) return;
    
    if (embellishButton && embellishButton.parentElement) {
      embellishButton.remove();
    }
    
    embellishButton = createEmbellishButton();
    currentInputElement = inputElement;
    positionButton(inputElement, embellishButton);
    
    console.log('润色按钮已注入');
  }

  function setLoadingState(isLoading) {
    if (!embellishButton) return;
    
    if (isLoading) {
      embellishButton.textContent = BUTTON_TEXT_LOADING;
      embellishButton.classList.add('loading');
    } else {
      embellishButton.textContent = BUTTON_TEXT_DEFAULT;
      embellishButton.classList.remove('loading');
    }
  }

  function handleEmbellishClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentInputElement) {
      alert('未找到输入框');
      return;
    }
    
    const content = getInputContent(currentInputElement);
    
    if (!content) {
      alert('请输入草稿');
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
          console.error('发送消息失败:', chrome.runtime.lastError);
          alert('发送请求失败，请检查插件配置');
          return;
        }
        
        if (response && response.success) {
          const embellishedText = response.data?.text || response.data;
          if (embellishedText) {
            setInputContent(currentInputElement, embellishedText);
            console.log('润色完成，已回填文本');
          }
        } else {
          const errorMsg = response?.error || '润色失败，请稍后重试';
          alert(errorMsg);
        }
      }
    );
  }

  function setupMutationObserver() {
    if (observer) {
      observer.disconnect();
    }
    
    observer = new MutationObserver(function(mutations) {
      let shouldReinject = false;
      
      for (const mutation of mutations) {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          shouldReinject = true;
          break;
        }
      }
      
      if (shouldReinject) {
        const inputElement = findInputElement();
        if (inputElement && inputElement !== currentInputElement) {
          injectButton(inputElement);
        }
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'hidden']
    });
  }

  function pollForInputElement() {
    let attempts = 0;
    const maxAttempts = 30;
    const pollInterval = 500;
    
    function poll() {
      attempts++;
      
      const inputElement = findInputElement();
      
      if (inputElement) {
        injectButton(inputElement);
        setupMutationObserver();
        return;
      }
      
      if (attempts < maxAttempts) {
        setTimeout(poll, pollInterval);
      } else {
        console.log('未找到输入框，将继续监听页面变化');
        setupMutationObserver();
      }
    }
    
    poll();
  }

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', pollForInputElement);
    } else {
      pollForInputElement();
    }
    
    window.addEventListener('resize', function() {
      if (currentInputElement && embellishButton) {
        positionButton(currentInputElement, embellishButton);
      }
    });
  }

  init();
  
})();
