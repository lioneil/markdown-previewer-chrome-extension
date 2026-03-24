export interface PluginSettings {
  mermaid: boolean;
  katex: boolean;
  emoji: boolean;
  footnote: boolean;
  alerts: boolean;
  sub: boolean;
  sup: boolean;
  mark: boolean;
  deflist: boolean;
  multimdTable: boolean;
  typographer: boolean;
}

export interface Settings {
  enabled: boolean;
  plugins: PluginSettings;
}

export const defaultSettings: Settings = {
  enabled: true,
  plugins: {
    mermaid: true,
    katex: true,
    emoji: true,
    footnote: true,
    alerts: true,
    sub: true,
    sup: true,
    mark: true,
    deflist: true,
    multimdTable: true,
    typographer: true,
  },
};

export const pluginLabels: Record<keyof PluginSettings, string> = {
  mermaid: 'Mermaid diagrams',
  katex: 'Math / KaTeX',
  emoji: 'Emoji shortcodes',
  footnote: 'Footnotes',
  alerts: 'GitHub alerts',
  sub: 'Subscript',
  sup: 'Superscript',
  mark: 'Highlight / Mark',
  deflist: 'Definition lists',
  multimdTable: 'Advanced tables',
  typographer: 'Typographer',
};

export async function getSettings(): Promise<Settings> {
  const { settings } = await chrome.storage.sync.get('settings');
  if (!settings) return defaultSettings;
  return {
    enabled: settings.enabled ?? defaultSettings.enabled,
    plugins: { ...defaultSettings.plugins, ...settings.plugins },
  };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.sync.set({ settings });
}
