// Chrome Extension Manifest V3 Service Worker
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'SAVE_JOB') {
    chrome.storage.local.get(['apiToken', 'serverUrl'], (data) => {
      const serverUrl = data.serverUrl || 'http://localhost:3000';
      const apiToken = data.apiToken || '';

      fetch(`${serverUrl}/api/v1/extension/save-job`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': apiToken ? `Bearer ${apiToken}` : ''
        },
        body: JSON.stringify(request.payload)
      })
      .then(res => res.json())
      .then(json => {
        sendResponse({ success: json.success, data: json.data, error: json.error });
      })
      .catch(err => {
        sendResponse({ success: false, error: err.message });
      });
    });
    return true; // Keeps async response channel open
  }
});
