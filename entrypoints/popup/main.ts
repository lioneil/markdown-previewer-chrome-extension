import { getSettings, saveSettings, defaultSettings, pluginLabels, type PluginSettings } from '@/lib/settings';

async function init() {
  // Version
  const manifest = chrome.runtime.getManifest();
  document.getElementById('version')!.textContent = `v${manifest.version}`;

  // Load settings
  const settings = await getSettings();

  // Enable toggle
  const enableToggle = document.getElementById('enable-toggle') as HTMLInputElement;
  enableToggle.checked = settings.enabled;
  enableToggle.addEventListener('change', async () => {
    settings.enabled = enableToggle.checked;
    await saveSettings(settings);
  });

  // Build plugin toggles
  const list = document.getElementById('plugin-list')!;
  const pluginKeys = Object.keys(pluginLabels) as (keyof PluginSettings)[];
  const pluginInputs: HTMLInputElement[] = [];

  for (const key of pluginKeys) {
    const row = document.createElement('label');
    row.className = 'toggle-row';

    const text = document.createElement('span');
    text.className = 'toggle-label';
    text.textContent = pluginLabels[key];

    const toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.className = 'toggle-input';
    toggle.checked = settings.plugins[key];
    toggle.addEventListener('change', async () => {
      settings.plugins[key] = toggle.checked;
      await saveSettings(settings);
      updateToggleAll();
    });

    const slider = document.createElement('span');
    slider.className = 'toggle-slider';

    const switchEl = document.createElement('span');
    switchEl.className = 'toggle-switch';
    switchEl.appendChild(toggle);
    switchEl.appendChild(slider);

    row.appendChild(text);
    row.appendChild(switchEl);
    list.appendChild(row);
    pluginInputs.push(toggle);
  }

  // Toggle all
  const toggleAll = document.getElementById('toggle-all') as HTMLInputElement;

  function updateToggleAll() {
    const allChecked = pluginInputs.every((i) => i.checked);
    const noneChecked = pluginInputs.every((i) => !i.checked);
    toggleAll.checked = allChecked;
    toggleAll.indeterminate = !allChecked && !noneChecked;
  }

  updateToggleAll();

  toggleAll.addEventListener('change', async () => {
    const checked = toggleAll.checked;
    pluginInputs.forEach((input, i) => {
      input.checked = checked;
      settings.plugins[pluginKeys[i]] = checked;
    });
    await saveSettings(settings);
  });

  // Reset button
  document.getElementById('reset-btn')!.addEventListener('click', async () => {
    await saveSettings(defaultSettings);
    await chrome.storage.sync.remove(['fontSize', 'wideMode', 'theme', 'sidebarCollapsed', 'fontFamily']);
    enableToggle.checked = defaultSettings.enabled;
    pluginInputs.forEach((input, i) => {
      input.checked = defaultSettings.plugins[pluginKeys[i]];
    });
    updateToggleAll();
  });

  // Apply theme to popup — always follows system preference
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.setAttribute('data-theme', systemDark ? 'dark' : 'light');
}

init();
