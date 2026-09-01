/**
 * DEV-006: Interactive checkboxes with save-a-copy persistence.
 * When a checkbox is toggled, a floating bar appears at the bottom
 * prompting the user to save a copy. Uses standard browser download.
 */

interface CheckboxEntry {
  lineNumber: number;
  inputEl: HTMLInputElement;
}

let currentSource: string;
let dirty = false;
let saveBar: HTMLElement | null = null;

/**
 * Pair each rendered checkbox with the source line the renderer recorded on its
 * list item. The renderer is the only thing that knows which lines are really
 * task items, so ordered lists, blockquotes and fenced code all come out right.
 */
function collectCheckboxes(inputs: NodeListOf<HTMLInputElement>): CheckboxEntry[] {
  return [...inputs].flatMap((inputEl) => {
    const line = inputEl.closest('.task-list-item')?.getAttribute('data-source-line');
    return line == null ? [] : [{ lineNumber: Number(line), inputEl }];
  });
}

/**
 * Toggle a checkbox line in the source string.
 */
function toggleLine(source: string, lineNumber: number, checked: boolean): string {
  const lines = source.split('\n');
  const line = lines[lineNumber];
  if (checked) {
    lines[lineNumber] = line.replace('[ ]', '[x]');
  } else {
    lines[lineNumber] = line.replace(/\[[xX]\]/, '[ ]');
  }
  return lines.join('\n');
}

/**
 * Get the filename from the current URL.
 */
function getFilename(): string {
  const path = decodeURIComponent(window.location.pathname);
  return path.split('/').pop() ?? 'document.md';
}

/**
 * Get the full file path from the current URL (for save dialog location hint).
 */
function getFilePath(): string {
  return decodeURIComponent(window.location.pathname);
}

/**
 * Trigger a save dialog via background script (chrome.downloads with saveAs).
 */
async function downloadSource() {
  const base64 = btoa(unescape(encodeURIComponent(currentSource)));
  const dataUrl = `data:text/markdown;base64,${base64}`;

  await chrome.runtime.sendMessage({
    type: 'save-file',
    dataUrl,
    filename: getFilename(),
    filepath: getFilePath(),
  });

  dirty = false;
  updateSaveBar();
}

/**
 * Create the save bar (hidden) so it's ready to animate.
 */
function createSaveBar(): HTMLElement {
  const bar = document.createElement('div');
  bar.className = 'checkbox-save-bar';

  const icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m8 11 4 4 4-4"/><path d="M8 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4"/></svg>';

  const text = document.createElement('span');
  text.className = 'checkbox-save-text';
  text.textContent = 'Changes made';

  const dismissBtn = document.createElement('button');
  dismissBtn.className = 'checkbox-save-dismiss';
  dismissBtn.textContent = 'Dismiss';
  dismissBtn.addEventListener('click', () => {
    dirty = false;
    updateSaveBar();
  });

  const saveBtn = document.createElement('button');
  saveBtn.className = 'checkbox-save-btn';
  saveBtn.innerHTML = `${icon} Save a Copy`;
  saveBtn.title = 'Download updated file';
  saveBtn.addEventListener('click', downloadSource);

  bar.appendChild(text);
  bar.appendChild(dismissBtn);
  bar.appendChild(saveBtn);

  document.body.appendChild(bar);
  return bar;
}

/**
 * Show the save bar with animation.
 */
function showSaveBar() {
  if (!saveBar) return;
  dirty = true;
  // Force reflow so browser registers the "before" state
  saveBar.offsetHeight;
  saveBar.classList.add('visible');
}

/**
 * Update save bar visibility based on dirty state.
 */
function updateSaveBar() {
  if (!saveBar) return;
  if (dirty) {
    saveBar.classList.add('visible');
  } else {
    saveBar.classList.remove('visible');
  }
}

/**
 * Initialize interactive checkboxes.
 */
export function initCheckboxes(rawMarkdown: string): void {
  currentSource = rawMarkdown;

  const inputs = document.querySelectorAll<HTMLInputElement>(
    '.md-body .task-list-item input[type="checkbox"]'
  );

  if (inputs.length === 0) return;

  // Enable all checkboxes (markdown-it-task-lists renders them disabled)
  inputs.forEach((input) => {
    input.disabled = false;
    input.style.cursor = 'pointer';
  });

  const entries = collectCheckboxes(inputs);

  // Create save bar (hidden, ready to animate)
  saveBar = createSaveBar();

  // Attach click handlers
  entries.forEach((entry) => {
    entry.inputEl.addEventListener('change', () => {
      const checked = entry.inputEl.checked;
      currentSource = toggleLine(currentSource, entry.lineNumber, checked);
      dirty = true;
      showSaveBar();
    });
  });
}
