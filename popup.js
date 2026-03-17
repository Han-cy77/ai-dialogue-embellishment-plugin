document.addEventListener('DOMContentLoaded', async function() {
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const statusDiv = document.getElementById('status');

  chrome.storage.local.get(['encryptedApiKey'], async function(result) {
    if (result.encryptedApiKey) {
      const decryptedKey = await CryptoUtil.decrypt(result.encryptedApiKey);
      if (decryptedKey) {
        apiKeyInput.value = decryptedKey;
      }
    }
  });

  saveBtn.addEventListener('click', async function() {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      showStatus('请输入 API Key', 'error');
      return;
    }
    
    try {
      const encryptedKey = await CryptoUtil.encrypt(apiKey);
      chrome.storage.local.set({ encryptedApiKey: encryptedKey }, function() {
        showStatus('保存成功！（已加密存储）', 'success');
      });
    } catch (error) {
      console.error('Encryption failed:', error);
      showStatus('加密失败，请重试', 'error');
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
});
