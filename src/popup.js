/**
 * Popup UI logic. Reads/writes two booleans in chrome.storage.local — no
 * other state, no network requests. See PRIVACY.md.
 */
const STORAGE_KEY = 'enabled';
const REDUCE_FLASH_KEY = 'reduceFlash';

const toggle = document.getElementById('enabled-toggle');
const reduceFlashToggle = document.getElementById('reduce-flash-toggle');
const status = document.getElementById('status');

function render(enabled) {
  toggle.checked = enabled;
  status.textContent = enabled ? 'AI answers are hidden.' : 'AI answers are shown.';
}

chrome.storage.local.get({ [STORAGE_KEY]: true, [REDUCE_FLASH_KEY]: false }, (result) => {
  render(result[STORAGE_KEY]);
  reduceFlashToggle.checked = result[REDUCE_FLASH_KEY];
});

toggle.addEventListener('change', () => {
  const enabled = toggle.checked;
  render(enabled);
  chrome.storage.local.set({ [STORAGE_KEY]: enabled });
});

reduceFlashToggle.addEventListener('change', () => {
  chrome.storage.local.set({ [REDUCE_FLASH_KEY]: reduceFlashToggle.checked });
});
