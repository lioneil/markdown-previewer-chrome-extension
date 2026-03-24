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

const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 62 62"><path d="M62,12.377l-0,37.246c-0,6.831 -5.546,12.377 -12.377,12.377l-49.623,-0l0,-49.623c0,-6.831 5.546,-12.377 12.377,-12.377l37.246,-0c6.831,-0 12.377,5.546 12.377,12.377Zm-57.151,30.534l7.007,0l-0,-13.663l7.006,8.759l7.007,-8.759l0,13.663l7.007,0l-0,-23.822l-7.007,-0l-7.007,8.758l-7.006,-8.758l-7.007,-0l0,23.822Zm43.792,0l10.51,-11.561l-7.007,0l0,-12.261l-7.006,-0l-0,12.261l-7.007,0l10.51,11.561Z"/></svg>`;

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
