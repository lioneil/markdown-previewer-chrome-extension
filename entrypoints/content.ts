import { createMarkdownRenderer } from '@/lib/markdown';
import { initTheme, resolveTheme, getThemePreference, type ThemePreference } from '@/lib/theme';
import { buildSidebar, initScrollSpy } from '@/lib/sidebar';
import { renderMermaidDiagrams, rerenderMermaidDiagrams } from '@/lib/mermaid';
import { initCheckboxes } from '@/lib/checkbox';
import { getSettings, type Settings } from '@/lib/settings';
import 'highlight.js/styles/github.css';
import 'katex/dist/katex.min.css';
import '@mdit/plugin-alert/style';
import '@/assets/content.css';

const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 62 62"><path fill-rule="evenodd" fill="#000" d="m31 62c-17.14 0-31-13.86-31-31 0-17.14 13.86-31 31-31 17.14 0 31 13.86 31 31 0 17.14-13.86 31-31 31z"/><path fill-rule="evenodd" fill="#000" d="m31 31v31h-31v-31z"/><path fill-rule="evenodd" fill="#fff" d="m52 19.21v26.58h-42v-26.58z"/><path fill-rule="evenodd" fill="#000" d="m53.5 17.08v27.34c0 5.01-4.07 9.08-9.08 9.08h-36.42v-36.42c0-5.01 4.07-9.08 9.08-9.08h27.34c5.01 0 9.08 4.07 9.08 9.08zm-41.94 22.41h5.14v-10.03l5.14 6.43 5.14-6.43v10.03h5.15v-17.48h-5.15l-5.14 6.43-5.14-6.43h-5.14zm32.14 0l7.71-8.49h-5.14v-8.99h-5.14v8.99h-5.15z"/></svg>`;

const iconCopy = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';
const iconCheck = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

function addCodeBlockEnhancements() {
  document.querySelectorAll('.md-body pre.hljs').forEach((pre) => {
    pre.classList.add('code-block');

    const code = pre.querySelector('code');
    const langClass = code?.className.match(/language-(\S+)/);
    if (langClass) {
      const label = document.createElement('span');
      label.className = 'code-lang';
      label.textContent = langClass[1];
      pre.appendChild(label);
    }

    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.title = 'Copy code';
    btn.innerHTML = iconCopy;
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(code?.textContent ?? '');
      btn.innerHTML = iconCheck;
      btn.title = 'Copied!';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.innerHTML = iconCopy;
        btn.title = 'Copy code';
        btn.classList.remove('copied');
      }, 2000);
    });
    pre.appendChild(btn);
  });
}

function wrapTables() {
  document.querySelectorAll('.md-body table').forEach((table) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'table-wrapper';
    table.parentNode!.insertBefore(wrapper, table);
    wrapper.appendChild(table);
  });
}

function renderPage(rawMarkdown: string, settings: Settings) {
  const md = createMarkdownRenderer(settings.plugins);
  const rendered = md.render(rawMarkdown);

  document.body.className = 'md-preview';
  document.body.innerHTML = `
    <main class="md-content">
      <article class="md-body">
        ${rendered}
      </article>
    </main>
  `;

  addCodeBlockEnhancements();
  wrapTables();

  // Make headings clickable — updates URL hash and scrolls
  document.querySelectorAll('.md-body h1, .md-body h2, .md-body h3, .md-body h4, .md-body h5, .md-body h6').forEach((h) => {
    if (!h.id) return;
    h.classList.add('md-heading-link');
    h.addEventListener('click', () => {
      history.replaceState(null, '', `#${h.id}`);
      h.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Sidebar
  const contentEl = document.querySelector('.md-content') as HTMLElement;
  const sidebar = buildSidebar(contentEl);
  document.body.insertBefore(sidebar, contentEl);
  initScrollSpy(sidebar);

  // Checkboxes
  initCheckboxes(rawMarkdown);

  // Theme
  initTheme();

  // Restore font size, wide mode, and font family
  chrome.storage.sync.get(['fontSize', 'wideMode', 'fontFamily']).then(({ fontSize, wideMode, fontFamily }) => {
    if (fontSize) document.body.style.fontSize = `${fontSize}px`;
    if (wideMode) document.body.classList.add('wide-mode');
    if (fontFamily === 'serif') document.body.classList.add('font-serif');
  });

  // Mermaid
  if (settings.plugins.mermaid) {
    getThemePreference().then((pref) => {
      renderMermaidDiagrams(resolveTheme(pref));
    });
  }

  // Back to top button
  const backToTop = document.createElement('button');
  backToTop.className = 'back-to-top';
  backToTop.title = 'Back to top';
  backToTop.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>';
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  document.body.appendChild(backToTop);

  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('visible', window.scrollY > 300);
  }, { passive: true });
}

export default defineContentScript({
  matches: [
    'file:///*/*.md',
    'file:///*/*.MD',
    'file:///*/*.Md',
    'file:///*/*.mD',
    'file:///*/*.markdown',
    'file:///*/*.MARKDOWN',
    'file:///*/*.Markdown',
  ],
  runAt: 'document_idle',

  async main() {
    const pre = document.querySelector('pre');
    if (!pre) return;

    const rawMarkdown = pre.textContent ?? '';

    // Favicon — append instead of replacing entire head
    const existingFavicon = document.querySelector('link[rel="icon"]');
    if (existingFavicon) existingFavicon.remove();
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.type = 'image/svg+xml';
    favicon.href = `data:image/svg+xml,${faviconSvg}`;
    document.head.appendChild(favicon);

    // Empty file — show clean empty state
    if (!rawMarkdown.trim()) {
      document.body.className = 'md-preview';
      document.body.innerHTML = `
        <main class="md-content">
          <article class="md-body md-empty">
            <p class="md-empty-message">This file is empty.</p>
          </article>
        </main>
      `;
      initTheme();
      return;
    }

    // Encoding warning
    if (document.characterSet && document.characterSet !== 'UTF-8') {
      console.warn(`File encoding is ${document.characterSet}, not UTF-8. Some characters may display incorrectly.`);
    }

    // Store original page content for toggling back to raw
    const originalBody = document.body.innerHTML;

    function showRaw() {
      document.body.className = 'md-preview-disabled';
      document.body.innerHTML = originalBody;
      document.body.style.fontSize = '';
    }

    function setTitle() {
      const h1 = document.querySelector('h1');
      if (h1) {
        document.title = h1.textContent ?? document.title;
      } else {
        const path = decodeURIComponent(window.location.pathname);
        document.title = path.split('/').pop() ?? 'Markdown Preview';
      }
    }

    // Apply theme synchronously before first render to prevent flash
    const themePref = await getThemePreference();
    document.documentElement.setAttribute('data-theme', resolveTheme(themePref));

    // Initial render
    const settings = await getSettings();
    if (settings.enabled) {
      renderPage(rawMarkdown, settings);
      setTitle();

      // Scroll to hash fragment if present in URL
      if (window.location.hash) {
        const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
        if (target) {
          requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
        }
      }
    }

    // React to settings/theme changes
    chrome.storage.onChanged.addListener(async (changes) => {
      if (changes.settings) {
        const newSettings = await getSettings();
        if (!newSettings.enabled) {
          showRaw();
          return;
        }
        renderPage(rawMarkdown, newSettings);
        setTitle();

        // Restore title
        const newH1 = document.querySelector('h1');
        if (newH1) document.title = newH1.textContent ?? document.title;
      } else if (changes.theme) {
        // Theme-only change — just re-render mermaid
        const pref = (changes.theme.newValue as ThemePreference) ?? 'auto';
        rerenderMermaidDiagrams(resolveTheme(pref));
      }
      if (changes.wideMode) {
        document.body.classList.toggle('wide-mode', changes.wideMode.newValue ?? false);
      }
      if (changes.fontFamily) {
        document.body.classList.toggle('font-serif', changes.fontFamily.newValue === 'serif');
      }
      if (changes.fontSize) {
        document.body.style.fontSize = changes.fontSize.newValue ? `${changes.fontSize.newValue}px` : '';
      }
    });
  },
});
