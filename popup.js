document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const statusDiv = document.getElementById('status');

  chrome.storage.sync.get(['apiKey'], function(result) {
    if (result.apiKey) {
      apiKeyInput.value = result.apiKey;
    }
  });

  saveBtn.addEventListener('click', function() {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      showStatus('请输入 API Key', 'error');
      return;
    }
    
    chrome.storage.sync.set({ apiKey: apiKey }, function() {
      showStatus('保存成功！', 'success');
    });
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
