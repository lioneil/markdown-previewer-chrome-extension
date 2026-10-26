# Markdown Previewer

A Chrome extension that renders local Markdown files.

[Install from the Chrome Web Store](https://chromewebstore.google.com/detail/markdown-previewer/nccgimhmfbjfiakcapgeofcfbpkpganp)

![Markdown Previewer](docs/screenshot-1.png)

## Setup

1. Install the extension from the Chrome Web Store.
2. Go to `chrome://extensions`, open **Details** for Markdown Previewer, and turn on **Allow access to file URLs**.
3. Open a `.md` or `.markdown` file in the browser.

Works in Chrome and Brave.

## Features

- GitHub Flavored Markdown
- Syntax highlighting and a copy button for code blocks
- Mermaid diagrams
- KaTeX math (`$...$` and `$$...$$`)
- GitHub alerts (`[!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`)
- Tables with colspan, rowspan and multi-line cells
- Footnotes, definition lists, emoji shortcodes, subscript, superscript and `==highlight==`
- Clickable task list checkboxes, with **Save a Copy** to download the updated file
- Outline sidebar with search
- Light, dark and auto themes
- Wide mode, font size and serif font controls

Optional syntaxes can be turned off from the toolbar popup. [`showcase.md`](showcase.md) has an example of each feature.

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Alt+Shift+T` | Cycle theme |
| `Ctrl+Shift+K` | Toggle sidebar |
| `Ctrl+Shift+F` | Search outline |
| `Ctrl+Shift+W` | Toggle wide mode (macOS only) |
| `Ctrl+Shift+G` | Toggle serif font |
| `Ctrl+Shift+=` / `Ctrl+Shift+-` | Increase / decrease font size |

## Privacy

The extension makes no network requests and does not upload your files. Settings are stored in `chrome.storage.sync`.

Permissions: `storage` for settings, `downloads` for Save a Copy.

## Development

Requires Node.js 22 or later.

```bash
git clone https://github.com/lioneil/markdown-previewer-chrome-extension.git
cd markdown-previewer-chrome-extension
npm install
npm run dev     # development build with hot reload
npm run build   # production build in .output/chrome-mv3
npm test
```

To load a build, turn on **Developer mode** in `chrome://extensions`, click **Load unpacked**, and select `.output/chrome-mv3`.

## Releasing

```bash
npm version patch   # or minor, major
git push --follow-tags
```

The tag runs the Release workflow, which tests the code and attaches the extension zip to a GitHub release. Upload that zip to the Chrome Web Store.

## License

[MIT](LICENSE)
