# Markdown Previewer

A Chrome extension that renders local Markdown files. Open a `.md` file from your disk and you get GitHub-style formatting, an outline sidebar, Mermaid diagrams, math, and a dark mode, in place of the plain text Chrome shows by default.

[**Install from the Chrome Web Store**](https://chromewebstore.google.com/detail/markdown-previewer/nccgimhmfbjfiakcapgeofcfbpkpganp)

![A Markdown file rendered by the extension, with the outline sidebar open](docs/screenshot-1.png)

## Getting started

1. Install the extension from the [Chrome Web Store](https://chromewebstore.google.com/detail/markdown-previewer/nccgimhmfbjfiakcapgeofcfbpkpganp). It works in Chrome and Brave.
2. Open `chrome://extensions`, click **Details** under Markdown Previewer, and turn on **Allow access to file URLs**. Chrome blocks extensions from local files until you do, and the extension cannot ask for this itself.
3. Drag a `.md` or `.markdown` file into the browser, or open it with a `file://` address.

To see every feature at once, open [`showcase.md`](showcase.md) from this repository.

## Features

### Rendering

The parser is [markdown-it](https://github.com/markdown-it/markdown-it) with GitHub Flavored Markdown, plus these additions:

- Code blocks are highlighted with highlight.js when the fence names a language (` ```js `, ` ```python `, and about 190 others). Each block has a copy button, and highlighted blocks show their language.
- Fences tagged `mermaid` become diagrams: flowcharts, sequence diagrams, Gantt charts, pie charts and the rest of what Mermaid 11 draws. They redraw when you switch themes.
- Math is typeset with KaTeX, inline with `$...$` and as blocks with `$$...$$`.
- Tables support colspan, rowspan and multi-line cells, and wide tables scroll sideways.
- GitHub alerts (`[!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`), footnotes, definition lists, emoji shortcodes like `:rocket:`, `H~2~O` subscript, `x^2^` superscript, and `==highlighted==` text.

A single line break in the source becomes a line break on the page, as in GitHub comments. Raw HTML is allowed, and bare URLs become links.

### Checkboxes

Task list items (`- [ ]`) are clickable. Once you change one, a bar appears with a **Save a Copy** button that downloads the updated Markdown through the usual Save As dialog. The original file is not modified, since Chrome extensions cannot write to disk. Unsaved changes are lost on reload.

### Outline sidebar

The sidebar lists the document's headings as a collapsible tree and highlights the section you are reading. Its search box filters headings with fuzzy matching: arrow keys move through the results, Enter jumps to one, and Escape closes the search. Clicking a heading in the document puts its anchor in the address bar, so you can link to a section.

### Reading controls

The sidebar toolbar switches between auto, light and dark themes (auto follows your system setting), widens the text column past its default 800px, changes the font size in five steps from 14px to 20px, and switches between sans-serif and serif text. A back-to-top button appears once you scroll down. These preferences are saved, and synced to your other devices when Chrome sync is on.

### Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Alt+Shift+T` | Cycle the theme (auto, light, dark) |
| `Ctrl+Shift+K` | Show or hide the sidebar |
| `Ctrl+Shift+F` | Search the outline |
| `Ctrl+Shift+W` | Toggle wide mode (macOS only: on Windows and Linux, Chrome uses this shortcut to close the window) |
| `Ctrl+Shift+G` | Switch between sans-serif and serif |
| `Ctrl+Shift+=` / `Ctrl+Shift+-` | Increase or decrease the font size |

The `Ctrl` shortcuts use the Control key on macOS too. You can change `Alt+Shift+T` at `chrome://extensions/shortcuts`.

### Popup settings

Click the toolbar icon to turn the previewer off (the page goes back to plain text straight away) or to switch off any of the optional syntaxes: Mermaid, KaTeX, emoji, footnotes, alerts, subscript, superscript, highlight, definition lists, advanced tables, and the typographer (smart quotes and dashes). **Reset to defaults** restores these and also resets the theme, font size, font, width and sidebar.

## Privacy

The extension makes no network requests of its own and never uploads your files. Its libraries and fonts are bundled, so it works offline. It stores only your preferences, in `chrome.storage.sync`. Images or HTML inside your Markdown that point to the web load the same way they would on any web page.

It asks for two permissions: `storage` for the preferences and `downloads` for **Save a Copy**.

## Development

You need Node.js 22 or later and npm.

```bash
git clone https://github.com/lioneil/markdown-previewer-chrome-extension.git
cd markdown-previewer-chrome-extension
npm install

npm run dev      # development build with hot reload
npm run build    # production build in .output/chrome-mv3
npm test         # unit tests (Vitest)
```

To load your build, open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked**, and choose `.output/chrome-mv3`. Then turn on **Allow access to file URLs** for it.

The extension is built with [WXT](https://wxt.dev/). The content script runs on `file://` pages ending in `.md` or `.markdown`, reads the text Chrome displays, renders it, and replaces the page.

### Releasing

```bash
npm version patch    # or minor, major: updates package.json, commits and tags
git push --follow-tags
```

Pushing the tag runs the Release workflow, which tests the code, builds the zip and attaches it to a new GitHub release. Upload that zip in the Chrome Web Store developer dashboard to publish it.

## License

[MIT](LICENSE)
