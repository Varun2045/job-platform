document.addEventListener('DOMContentLoaded', () => {
  const serverUrlInput = document.getElementById('serverUrl');
  const apiTokenInput = document.getElementById('apiToken');
  const saveBtn = document.getElementById('saveBtn');
  const statusDiv = document.getElementById('status');

  // Load saved config
  chrome.storage.local.get(['serverUrl', 'apiToken'], (data) => {
    if (data.serverUrl) serverUrlInput.value = data.serverUrl;
    if (data.apiToken) apiTokenInput.value = data.apiToken;
  });

  // Save config on change
  serverUrlInput.addEventListener('change', () => {
    chrome.storage.local.set({ serverUrl: serverUrlInput.value });
  });
  apiTokenInput.addEventListener('change', () => {
    chrome.storage.local.set({ apiToken: apiTokenInput.value });
  });

  saveBtn.addEventListener('click', () => {
    statusDiv.style.color = '#94a3b8';
    statusDiv.innerText = 'Extracting job...';

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || !tabs[0]) {
        statusDiv.style.color = '#f87171';
        statusDiv.innerText = 'No active tab found';
        return;
      }

      chrome.tabs.sendMessage(tabs[0].id, { action: 'EXTRACT_CURRENT_JOB' }, (response) => {
        if (chrome.runtime.lastError || !response || !response.success) {
          statusDiv.style.color = '#f87171';
          statusDiv.innerText = 'Failed to extract job details';
          return;
        }

        statusDiv.innerText = 'Sending to Job Monitor...';
        chrome.runtime.sendMessage({ action: 'SAVE_JOB', payload: response.payload }, (res) => {
          if (res && res.success) {
            statusDiv.style.color = '#34d399';
            statusDiv.innerText = '✓ Job successfully saved!';
          } else {
            statusDiv.style.color = '#f87171';
            statusDiv.innerText = `Error: ${res?.error?.message || res?.error || 'Failed to save'}`;
          }
        });
      });
    });
  });
});
