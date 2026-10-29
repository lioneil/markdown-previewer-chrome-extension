import markdownit, { type MarkdownIt, type StateCore } from 'markdown-it';
import hljs from 'highlight.js';
import taskLists from 'markdown-it-task-lists';
import footnote from 'markdown-it-footnote';
import { full as emoji } from 'markdown-it-emoji';
import sub from 'markdown-it-sub';
import sup from 'markdown-it-sup';
import mark from 'markdown-it-mark';
import deflist from 'markdown-it-deflist';
import anchor from 'markdown-it-anchor';
import multimdTable from 'markdown-it-multimd-table';
import { alert } from '@mdit/plugin-alert';
import katex from '@traptitech/markdown-it-katex';
import { frontmatter } from './frontmatter';
import type { PluginSettings } from './settings';

export function createMarkdownRenderer(plugins?: Partial<PluginSettings>): MarkdownIt {
  // Default all plugins to enabled
  const p = {
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
    ...plugins,
  };

  const md: MarkdownIt = markdownit({
    html: true,
    linkify: true,
    typographer: p.typographer,
    breaks: true,
    highlight(str, lang) {
      // Mermaid blocks get a placeholder div, not syntax highlighting
      if (p.mermaid && lang && lang.trim().toLowerCase() === 'mermaid') {
        return '';
      }
      if (lang && hljs.getLanguage(lang)) {
        try {
          return `<pre class="hljs"><code class="language-${lang}">${hljs.highlight(str, { language: lang }).value}</code></pre>`;
        } catch {
          // fall through
        }
      }
      return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
    },
  });

  md.use(frontmatter);
  md.use(taskLists, { enabled: true, label: true });

  // Record the line each task item came from, so toggling a checkbox can write
  // back to the right line without re-parsing the markdown. Runs after the task
  // list rule, which is what tags the item with `task-list-item`.
  md.core.ruler.push('task_list_source_lines', (state: StateCore) => {
    for (const token of state.tokens) {
      if (
        token.type === 'list_item_open' &&
        token.map &&
        token.attrGet('class')?.toString().includes('task-list-item')
      ) {
        token.attrSet('data-source-line', String(token.map[0]));
      }
    }
    return true;
  });

  md.use(anchor);

  if (p.footnote) md.use(footnote);
  if (p.emoji) md.use(emoji);
  if (p.sub) md.use(sub);
  if (p.sup) md.use(sup);
  if (p.mark) md.use(mark);
  if (p.deflist) md.use(deflist);
  if (p.multimdTable) {
    // markdown-it 15 dropped utils.assign, which markdown-it-multimd-table 4.2.3
    // still calls while it sets up.
    md.utils = Object.assign({}, md.utils, { assign: Object.assign });
    md.use(multimdTable, {
      multiline: true,
      rowspan: true,
      headerless: true,
    });
  }
  if (p.alerts) md.use(alert, {
    // Title the alert the way GitHub does ("Note"), whatever case the source uses.
    titleRenderer: (tokens, idx) => {
      const name = tokens[idx].markup;
      return `<p class="markdown-alert-title">${name[0].toUpperCase()}${name.slice(1)}</p>\n`;
    },
  });
  if (p.katex) md.use(katex, { throwOnError: false });

  // Override fence renderer for mermaid blocks
  if (p.mermaid) {
    const defaultFence = md.renderer.rules.fence!.bind(md.renderer.rules);
    md.renderer.rules.fence = (tokens, idx, options, env, self) => {
      const token = tokens[idx];
      if (token.info.trim().toLowerCase() === 'mermaid') {
        const encoded = encodeURIComponent(token.content);
        return `<div class="mermaid-container" data-mermaid="${encoded}"></div>`;
      }
      return defaultFence(tokens, idx, options, env, self);
    };
  }

  return md;
}
