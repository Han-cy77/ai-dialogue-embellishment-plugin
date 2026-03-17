chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'sendRequest') {
    handleApiRequest(request.data)
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
