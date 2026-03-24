import { cycleTheme, getThemePreference, type ThemePreference } from './theme';

// Lucide icons (inline SVG)
const icons = {
  sun: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>',
  moon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>',
  monitor: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>',
  panelLeft: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/></svg>',
  fontSans: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><text x="12" y="17" text-anchor="middle" font-family="-apple-system,system-ui,sans-serif" font-size="14" font-weight="600" fill="currentColor">Aa</text></svg>',
  fontSerif: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><text x="12" y="17" text-anchor="middle" font-family="Georgia,Times New Roman,serif" font-size="14" font-weight="600" fill="currentColor">Aa</text></svg>',
  maximize: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(45deg)"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" x2="14" y1="3" y2="10"/><line x1="3" x2="10" y1="21" y2="14"/></svg>',
  minimize: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(45deg)"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" x2="21" y1="10" y2="3"/><line x1="3" x2="10" y1="21" y2="14"/></svg>',
  search: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
  x: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
  aArrowUp: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 13h6"/><path d="m2 16 4.5-9 4.5 9"/><path d="M18 7v9"/><path d="m14 12 4-4 4 4"/></svg>',
  aArrowDown: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 13h6"/><path d="m2 16 4.5-9 4.5 9"/><path d="M18 16V7"/><path d="m14 11 4 4 4-4"/></svg>',
};

const themeIcons: Record<ThemePreference, string> = {
  auto: icons.monitor,
  light: icons.sun,
  dark: icons.moon,
};

const themeLabels: Record<ThemePreference, string> = {
  auto: 'Theme: Auto (Alt+Shift+T)',
  light: 'Theme: Light (Alt+Shift+T)',
  dark: 'Theme: Dark (Alt+Shift+T)',
};

/**
 * Fuzzy match: returns highlighted HTML string or null if no match.
 * Matches characters in order but not necessarily adjacent.
 */
function fuzzyMatch(text: string, query: string): string | null {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  let qi = 0;
  const parts: string[] = [];
  for (let i = 0; i < text.length; i++) {
    if (qi < q.length && lower[i] === q[qi]) {
      parts.push(`<mark class="search-highlight">${escapeHtml(text[i])}</mark>`);
      qi++;
    } else {
      parts.push(escapeHtml(text[i]));
    }
  }
  return qi === q.length ? parts.join('') : null;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function buildSidebar(contentEl: HTMLElement): HTMLElement {
  const sidebar = document.createElement('aside');
  sidebar.className = 'md-sidebar';

  // Header with collapse toggle
  const header = document.createElement('div');
  header.className = 'md-sidebar-header';

  const title = document.createElement('span');
  title.textContent = 'OUTLINE';

  const collapseBtn = document.createElement('button');
  collapseBtn.className = 'md-sidebar-collapse';
  collapseBtn.innerHTML = icons.panelLeft;
  collapseBtn.title = 'Toggle sidebar (Ctrl+Shift+K)';

  const headerRight = document.createElement('div');
  headerRight.className = 'md-sidebar-header-actions';

  const searchBtn = document.createElement('button');
  searchBtn.className = 'md-sidebar-collapse md-search-toggle';
  searchBtn.innerHTML = icons.search;
  searchBtn.title = 'Search outline (Ctrl+Shift+F)';

  // Search field (inline in header, replaces title when active)
  const searchField = document.createElement('div');
  searchField.className = 'md-search-field';

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Filter headings...';
  searchInput.className = 'md-search-input';
  searchInput.setAttribute('aria-label', 'Filter headings');

  const clearBtn = document.createElement('button');
  clearBtn.className = 'md-search-clear';
  clearBtn.innerHTML = icons.x;
  clearBtn.title = 'Clear search';

  searchField.appendChild(searchInput);
  searchField.appendChild(clearBtn);

  headerRight.appendChild(searchBtn);
  headerRight.appendChild(collapseBtn);

  header.appendChild(title);
  header.appendChild(searchField);
  header.appendChild(headerRight);
  sidebar.appendChild(header);

  // Navigation
  const nav = document.createElement('nav');
  nav.className = 'md-sidebar-nav';
  nav.setAttribute('role', 'navigation');
  nav.setAttribute('aria-label', 'Document outline');

  interface LinkEntry {
    el: HTMLAnchorElement;
    text: string;
    heading: Element;
    level: number;
  }
  const linkEntries: LinkEntry[] = [];

  const chevronIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';

  const headings = contentEl.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const headingList = Array.from(headings);

  // Check if a heading at index i has children (deeper headings following it)
  function hasChildren(i: number): boolean {
    const level = parseInt(headingList[i].tagName[1]);
    if (i + 1 >= headingList.length) return false;
    return parseInt(headingList[i + 1].tagName[1]) > level;
  }

  // Build nested tree using a stack-based approach
  function buildTree(parent: HTMLElement, startIdx: number, parentLevel: number): number {
    let i = startIdx;
    while (i < headingList.length) {
      const h = headingList[i];
      const level = parseInt(h.tagName[1]);

      // If this heading is at a shallower or equal level to parent, we're done with this group
      if (level <= parentLevel && i > startIdx) break;

      const link = document.createElement('a');
      link.href = `#${h.id}`;
      link.textContent = h.textContent ?? '';
      link.className = `md-sidebar-link md-sidebar-level-${level}`;
      link.addEventListener('click', (e) => {
        e.preventDefault();
        h.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      linkEntries.push({ el: link, text: h.textContent ?? '', heading: h, level });

      if (hasChildren(i)) {
        // Collapsible group
        const details = document.createElement('details');
        details.className = 'md-sidebar-group';
        details.open = true;

        const summary = document.createElement('summary');
        summary.className = 'md-sidebar-summary';

        const toggle = document.createElement('span');
        toggle.className = 'md-sidebar-chevron';
        toggle.innerHTML = chevronIcon;

        summary.appendChild(toggle);
        summary.appendChild(link);
        details.appendChild(summary);

        const children = document.createElement('div');
        children.className = 'md-sidebar-children';
        i = buildTree(children, i + 1, level);
        details.appendChild(children);

        parent.appendChild(details);
      } else {
        // Leaf item (no children)
        const row = document.createElement('div');
        row.className = 'md-sidebar-leaf';
        row.appendChild(link);
        parent.appendChild(row);
        i++;
      }
    }
    return i;
  }

  buildTree(nav, 0, 0);
  sidebar.appendChild(nav);

  // Search behavior
  let searchOpen = false;

  function toggleSearch(open?: boolean) {
    searchOpen = open ?? !searchOpen;
    searchField.classList.toggle('active', searchOpen);
    searchBtn.classList.toggle('active', searchOpen);
    sidebar.classList.toggle('searching', searchOpen);
    if (searchOpen) {
      searchInput.focus();
    } else {
      searchInput.value = '';
      filterLinks('');
    }
  }

  function filterLinks(query: string) {
    if (!query) {
      nav.classList.remove('searching-flat');
      linkEntries.forEach(({ el, text }) => {
        el.style.display = '';
        el.innerHTML = escapeHtml(text);
      });
      return;
    }
    nav.classList.add('searching-flat');
    linkEntries.forEach(({ el, text }) => {
      const highlighted = fuzzyMatch(text, query);
      if (highlighted) {
        el.style.display = '';
        el.innerHTML = highlighted;
      } else {
        el.style.display = 'none';
      }
    });
  }

  // Keyboard navigation for outline items
  let focusedIndex = -1;

  function getVisibleLinks(): LinkEntry[] {
    return linkEntries.filter(({ el }) => el.style.display !== 'none');
  }

  function setFocused(index: number) {
    const visible = getVisibleLinks();
    if (visible.length === 0) return;

    // Remove previous focus
    if (focusedIndex >= 0 && focusedIndex < visible.length) {
      visible[focusedIndex].el.classList.remove('focused');
    }

    // Clamp index
    focusedIndex = Math.max(0, Math.min(index, visible.length - 1));

    // Apply focus
    const entry = visible[focusedIndex];
    entry.el.classList.add('focused');
    entry.el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function clearFocused() {
    linkEntries.forEach(({ el }) => el.classList.remove('focused'));
    focusedIndex = -1;
  }

  function navigateToFocused() {
    const visible = getVisibleLinks();
    if (focusedIndex >= 0 && focusedIndex < visible.length) {
      visible[focusedIndex].heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  searchBtn.addEventListener('click', () => toggleSearch());
  clearBtn.addEventListener('click', () => { toggleSearch(false); clearFocused(); });
  searchInput.addEventListener('input', () => {
    filterLinks(searchInput.value);
    clearFocused();
  });
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      toggleSearch(false);
      clearFocused();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocused(focusedIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocused(focusedIndex - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      navigateToFocused();
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (!e.ctrlKey || !e.shiftKey) return;

    if (e.key === 'F') {
      // Ctrl+Shift+F — toggle search
      e.preventDefault();
      if (sidebar.classList.contains('collapsed')) {
        sidebar.classList.remove('collapsed');
        chrome.storage.sync.set({ sidebarCollapsed: false });
      }
      toggleSearch();
      clearFocused();
    } else if (e.key === 'K') {
      // Ctrl+Shift+K — toggle sidebar
      e.preventDefault();
      const collapsed = sidebar.classList.toggle('collapsed');
      chrome.storage.sync.set({ sidebarCollapsed: collapsed });
    } else if (e.key === 'W') {
      // Ctrl+Shift+W — toggle wide mode
      e.preventDefault();
      const isWide = document.body.classList.toggle('wide-mode');
      chrome.storage.sync.set({ wideMode: isWide });
      const wideToggle = document.getElementById('wide-toggle');
      if (wideToggle) {
        wideToggle.innerHTML = isWide ? icons.minimize : icons.maximize;
        wideToggle.title = isWide ? 'Normal width (Ctrl+Shift+W)' : 'Wide mode (Ctrl+Shift+W)';
      }
    } else if (e.key === 'G') {
      // Ctrl+Shift+G — toggle font style
      e.preventDefault();
      fontStyleBtn.click();
    } else if (e.key === '=' || e.key === '+') {
      // Ctrl+Shift+= — increase font size
      e.preventDefault();
      fontUpBtn.click();
    } else if (e.key === '-' || e.key === '_') {
      // Ctrl+Shift+- — decrease font size
      e.preventDefault();
      fontDownBtn.click();
    }
  });

  // Bottom toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'md-sidebar-toolbar';

  // Theme toggle button
  const themeBtn = document.createElement('button');
  themeBtn.className = 'toolbar-btn';
  themeBtn.id = 'theme-toggle';
  getThemePreference().then((pref) => {
    themeBtn.innerHTML = themeIcons[pref];
    themeBtn.title = themeLabels[pref];
  });
  themeBtn.addEventListener('click', async () => {
    const next = await cycleTheme();
    themeBtn.innerHTML = themeIcons[next];
    themeBtn.title = themeLabels[next];
  });
  toolbar.appendChild(themeBtn);

  // Wide mode toggle button
  const wideBtn = document.createElement('button');
  wideBtn.className = 'toolbar-btn';
  wideBtn.id = 'wide-toggle';
  chrome.storage.sync.get('wideMode').then(({ wideMode }) => {
    const isWide = wideMode ?? false;
    wideBtn.innerHTML = isWide ? icons.minimize : icons.maximize;
    wideBtn.title = isWide ? 'Normal width (Ctrl+Shift+W)' : 'Wide mode (Ctrl+Shift+W)';
    if (isWide) document.body.classList.add('wide-mode');
  });
  wideBtn.addEventListener('click', async () => {
    const isWide = document.body.classList.toggle('wide-mode');
    wideBtn.innerHTML = isWide ? icons.minimize : icons.maximize;
    wideBtn.title = isWide ? 'Normal width (Ctrl+Shift+W)' : 'Wide mode (Ctrl+Shift+W)';
    await chrome.storage.sync.set({ wideMode: isWide });
  });
  toolbar.appendChild(wideBtn);

  // Font style toggle button (sans-serif ↔ serif)
  const fontStyleBtn = document.createElement('button');
  fontStyleBtn.className = 'toolbar-btn';
  fontStyleBtn.id = 'font-style-toggle';
  chrome.storage.sync.get('fontFamily').then(({ fontFamily }) => {
    const isSerif = fontFamily === 'serif';
    fontStyleBtn.innerHTML = isSerif ? icons.fontSerif : icons.fontSans;
    fontStyleBtn.title = isSerif ? 'Font: Serif (Ctrl+Shift+G)' : 'Font: Sans-serif (Ctrl+Shift+G)';
    if (isSerif) document.body.classList.add('font-serif');
  });
  fontStyleBtn.addEventListener('click', async () => {
    const isSerif = document.body.classList.toggle('font-serif');
    fontStyleBtn.innerHTML = isSerif ? icons.fontSerif : icons.fontSans;
    fontStyleBtn.title = isSerif ? 'Font: Serif (Ctrl+Shift+G)' : 'Font: Sans-serif (Ctrl+Shift+G)';
    await chrome.storage.sync.set({ fontFamily: isSerif ? 'serif' : 'sans-serif' });
  });
  toolbar.appendChild(fontStyleBtn);

  // Font size controls
  const fontSizes = [14, 15, 16, 18, 20];
  const defaultSize = 16;

  const fontGroup = document.createElement('div');
  fontGroup.className = 'toolbar-btn-group';

  const fontDownBtn = document.createElement('button');
  fontDownBtn.className = 'toolbar-btn-grouped';
  fontDownBtn.innerHTML = icons.aArrowDown;
  fontDownBtn.title = 'Decrease text size (Ctrl+Shift+-)';

  const fontUpBtn = document.createElement('button');
  fontUpBtn.className = 'toolbar-btn-grouped';
  fontUpBtn.innerHTML = icons.aArrowUp;
  fontUpBtn.title = 'Increase text size (Ctrl+Shift+=)';

  fontGroup.appendChild(fontDownBtn);
  fontGroup.appendChild(fontUpBtn);
  toolbar.appendChild(fontGroup);

  function applyFontSize(size: number) {
    document.body.style.fontSize = `${size}px`;
    fontDownBtn.classList.toggle('disabled', size <= fontSizes[0]);
    fontUpBtn.classList.toggle('disabled', size >= fontSizes[fontSizes.length - 1]);
  }

  chrome.storage.sync.get('fontSize').then(({ fontSize }) => {
    applyFontSize(fontSize ?? defaultSize);
  });

  fontUpBtn.addEventListener('click', async () => {
    const { fontSize: current } = await chrome.storage.sync.get('fontSize');
    const cur = current ?? defaultSize;
    const idx = fontSizes.indexOf(cur);
    if (idx < fontSizes.length - 1) {
      const next = fontSizes[idx + 1];
      applyFontSize(next);
      await chrome.storage.sync.set({ fontSize: next });
    }
  });

  fontDownBtn.addEventListener('click', async () => {
    const { fontSize: current } = await chrome.storage.sync.get('fontSize');
    const cur = current ?? defaultSize;
    const idx = fontSizes.indexOf(cur);
    if (idx > 0) {
      const next = fontSizes[idx - 1];
      applyFontSize(next);
      await chrome.storage.sync.set({ fontSize: next });
    }
  });

  sidebar.appendChild(toolbar);

  // Collapse/expand behavior
  collapseBtn.addEventListener('click', async () => {
    const collapsed = sidebar.classList.toggle('collapsed');
    await chrome.storage.sync.set({ sidebarCollapsed: collapsed });
  });

  // Restore collapsed state
  chrome.storage.sync.get('sidebarCollapsed').then(({ sidebarCollapsed }) => {
    if (sidebarCollapsed) sidebar.classList.add('collapsed');
  });

  // Listen for storage changes (theme, font style)
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.theme) {
      const pref = (changes.theme.newValue as ThemePreference) ?? 'auto';
      themeBtn.innerHTML = themeIcons[pref];
      themeBtn.title = themeLabels[pref];
    }
    if (changes.fontFamily) {
      const isSerif = changes.fontFamily.newValue === 'serif';
      fontStyleBtn.innerHTML = isSerif ? icons.fontSerif : icons.fontSans;
      fontStyleBtn.title = isSerif ? 'Font: Serif (Ctrl+Shift+G)' : 'Font: Sans-serif (Ctrl+Shift+G)';
    }
  });

  return sidebar;
}

export function initScrollSpy(sidebar: HTMLElement): void {
  const nav = sidebar.querySelector('.md-sidebar-nav');
  if (!nav) return;

  const links = nav.querySelectorAll<HTMLAnchorElement>('.md-sidebar-link');
  if (links.length === 0) return;

  // Track which heading is currently "active" based on scroll position
  const headingIds = Array.from(links).map((l) => l.getAttribute('href')!.slice(1));
  const headingEls = headingIds
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => el !== null);

  let currentActive: HTMLAnchorElement | null = null;

  function setActive(link: HTMLAnchorElement | null) {
    if (currentActive === link) return;
    currentActive?.classList.remove('active');
    link?.classList.add('active');
    currentActive = link;

    // Scroll the active link into view within the sidebar nav
    if (link) {
      link.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  const observer = new IntersectionObserver(
    (entries) => {
      // Find the topmost visible heading
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const link = nav.querySelector<HTMLAnchorElement>(`a[href="#${entry.target.id}"]`);
          if (link) setActive(link);
          return;
        }
      }
    },
    { rootMargin: '0px 0px -75% 0px' },
  );

  headingEls.forEach((h) => observer.observe(h));

  // Set initial active heading (the one closest to top of viewport)
  requestAnimationFrame(() => {
    for (const h of headingEls) {
      const rect = h.getBoundingClientRect();
      if (rect.top >= 0) {
        const link = nav.querySelector<HTMLAnchorElement>(`a[href="#${h.id}"]`);
        if (link) setActive(link);
        break;
      }
    }
    // If none are below top (scrolled past all), activate the last one
    if (!currentActive && links.length > 0) {
      setActive(links[links.length - 1]);
    }
  });
}
