import { cycleTheme } from '@/lib/theme';

export default defineBackground(() => {
  chrome.commands.onCommand.addListener((command) => {
    if (command === 'toggle-theme') {
      cycleTheme();
    }
  });

  // Handle save-file requests from content script
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'save-file') {
      const { dataUrl, filepath } = message;
      // Use full path — chrome.downloads interprets this relative to the
      // default downloads dir, but with saveAs:true the system dialog opens
      // and the filename field will contain the full path, which on macOS/Linux
      // navigates the dialog to the original file's directory.
      chrome.downloads.download(
        { url: dataUrl, filename: filepath, saveAs: true },
        (downloadId) => {
          if (chrome.runtime.lastError) {
            // Full path rejected — fall back to just the filename
            const filename = filepath.split('/').pop() || 'document.md';
            chrome.downloads.download(
              { url: dataUrl, filename, saveAs: true },
              (retryId) => {
                sendResponse({ ok: retryId !== undefined });
              },
            );
          } else {
            sendResponse({ ok: downloadId !== undefined });
          }
        },
      );
      return true; // async response
    }
  });
});
