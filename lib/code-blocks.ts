const iconCopy = '<span class="copy-icon copy-icon-copy" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg></span>';
const iconCheck = '<span class="copy-icon copy-icon-check" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path pathLength="1" d="M4 12 9 17 20 6"/></svg></span>';

/**
 * Language label and copy button for each highlighted code block.
 * Both sit on a wrapper around the scrolling <pre>, so a long line can
 * scroll without carrying the button off the top-right corner of the well.
 */
export function enhanceCodeBlocks(root: ParentNode = document): void {
  root.querySelectorAll('.md-body pre.hljs').forEach((pre) => {
    if (pre.parentElement?.classList.contains('code-block')) return;

    const well = document.createElement('div');
    well.className = 'code-block';
    pre.parentNode!.insertBefore(well, pre);
    well.appendChild(pre);

    const code = pre.querySelector('code');
    const langClass = code?.className.match(/language-(\S+)/);
    if (langClass) {
      const label = document.createElement('span');
      label.className = 'code-lang';
      label.textContent = langClass[1];
      well.appendChild(label);
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-btn';
    btn.title = 'Copy code';
    btn.setAttribute('aria-label', 'Copy code');
    btn.innerHTML = iconCopy + iconCheck;
    let resetTimer = 0;
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(code?.textContent ?? '');
      btn.title = 'Copied!';
      btn.setAttribute('aria-label', 'Copied');
      btn.classList.remove('copied');
      void btn.offsetWidth;
      btn.classList.add('copied');
      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => {
        btn.title = 'Copy code';
        btn.setAttribute('aria-label', 'Copy code');
        btn.classList.remove('copied');
      }, 2000);
    });
    well.appendChild(btn);
  });
}
