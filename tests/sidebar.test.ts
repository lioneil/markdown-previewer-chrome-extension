import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import { buildSidebar } from '@/lib/sidebar';

function setViewportWidth(width: number) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query === '(max-width: 768px)' && width <= 768,
  }));
}

async function mount() {
  const content = document.createElement('main');
  content.innerHTML = '<h1 id="title">Title</h1>';
  const sidebar = buildSidebar(content);
  await new Promise((resolve) => setTimeout(resolve));
  return sidebar;
}

beforeEach(() => {
  vi.stubGlobal('chrome', fakeBrowser);
});

afterEach(() => {
  vi.unstubAllGlobals();
  fakeBrowser.reset();
});

describe('sidebar collapsed state', () => {
  it('starts collapsed on a narrow screen', async () => {
    setViewportWidth(375);
    expect((await mount()).classList.contains('collapsed')).toBe(true);
  });

  it('starts expanded on a wide screen', async () => {
    setViewportWidth(1280);
    expect((await mount()).classList.contains('collapsed')).toBe(false);
  });

  it('restores a saved collapse on a wide screen', async () => {
    setViewportWidth(1280);
    await chrome.storage.sync.set({ sidebarCollapsed: true });
    expect((await mount()).classList.contains('collapsed')).toBe(true);
  });
});
