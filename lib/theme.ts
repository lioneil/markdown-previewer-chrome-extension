export type ThemePreference = 'auto' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export function resolveTheme(pref: ThemePreference): ResolvedTheme {
  if (pref === 'auto') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return pref;
}

export function applyTheme(theme: ResolvedTheme): void {
  document.documentElement.setAttribute('data-theme', theme);
}

export async function getThemePreference(): Promise<ThemePreference> {
  const { theme } = await chrome.storage.sync.get('theme');
  return (theme as ThemePreference) ?? 'auto';
}

export async function setThemePreference(theme: ThemePreference): Promise<void> {
  await chrome.storage.sync.set({ theme });
}

export async function cycleTheme(): Promise<ThemePreference> {
  const current = await getThemePreference();
  const next: ThemePreference =
    current === 'auto' ? 'light' :
    current === 'light' ? 'dark' : 'auto';
  await setThemePreference(next);
  return next;
}

let listenersAttached = false;

export function initTheme(): void {
  // Apply immediately
  getThemePreference().then((pref) => {
    applyTheme(resolveTheme(pref));
  });

  // Only attach global listeners once to avoid accumulation on re-renders
  if (listenersAttached) return;
  listenersAttached = true;

  // React to system preference changes (when set to 'auto')
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', async () => {
    const pref = await getThemePreference();
    if (pref === 'auto') {
      applyTheme(resolveTheme('auto'));
    }
  });

  // React to storage changes (from popup or keyboard shortcut)
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.theme) {
      const pref = (changes.theme.newValue as ThemePreference) ?? 'auto';
      applyTheme(resolveTheme(pref));
    }
  });
}
