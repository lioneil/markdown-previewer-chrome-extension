import { defineConfig } from 'wxt';

// Vite plugin to escape non-ASCII chars in JS output.
// Chrome's content script loader rejects files it considers non-UTF-8,
// which can happen when bundled JS contains literal Unicode characters
// (e.g., from markdown-it-emoji data tables).
function asciiPlugin() {
  return {
    name: 'force-ascii-js',
    generateBundle(_: unknown, bundle: Record<string, { type: string; code?: string }>) {
      for (const file of Object.values(bundle)) {
        if (file.type === 'chunk' && file.code) {
          file.code = file.code.replace(/[^\x00-\x7F]/g, (ch) => {
            const code = ch.codePointAt(0)!;
            if (code > 0xFFFF) {
              const offset = code - 0x10000;
              const high = 0xD800 + (offset >> 10);
              const low = 0xDC00 + (offset & 0x3FF);
              return `\\u${high.toString(16).padStart(4, '0')}\\u${low.toString(16).padStart(4, '0')}`;
            }
            return `\\u${code.toString(16).padStart(4, '0')}`;
          });
        }
      }
    },
  };
}

export default defineConfig({
  manifest: {
    name: 'Markdown Previewer',
    description: 'Render local markdown files beautifully — GFM, Mermaid diagrams, syntax highlighting, TOC sidebar, dark mode, and more.',
    // version comes from package.json, so `npm version` drives the release
    permissions: ['storage', 'downloads'],
    icons: {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
      48: 'icons/icon-48.png',
      128: 'icons/icon-128.png',
    },
    action: {
      default_icon: {
        16: 'icons/icon-16.png',
        32: 'icons/icon-32.png',
        48: 'icons/icon-48.png',
        128: 'icons/icon-128.png',
      },
    },
    commands: {
      'toggle-theme': {
        suggested_key: {
          default: 'Alt+Shift+T',
        },
        description: 'Toggle light/dark theme',
      },
    },
  },
  vite: () => ({
    build: {
      minify: 'esbuild',
    },
    esbuild: {
      charset: 'ascii',
    },
    plugins: [asciiPlugin()],
  }),
});
