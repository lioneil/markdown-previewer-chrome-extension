import MarkdownIt from 'markdown-it';
import type StateCore from 'markdown-it/lib/rules_core/state_core.mjs';
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

  const md = new MarkdownIt({
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

  md.use(taskLists, { enabled: true, label: true });

  // Record the line each task item came from, so toggling a checkbox can write
  // back to the right line without re-parsing the markdown. Runs after the task
  // list rule, which is what tags the item with `task-list-item`.
  md.core.ruler.push('task_list_source_lines', (state: StateCore) => {
    for (const token of state.tokens) {
      if (
        token.type === 'list_item_open' &&
        token.map &&
        token.attrGet('class')?.includes('task-list-item')
      ) {
        token.attrSet('data-source-line', String(token.map[0]));
      }
    }
    return true;
  });

  md.use(anchor, { permalink: false });

  if (p.footnote) md.use(footnote);
  if (p.emoji) md.use(emoji);
  if (p.sub) md.use(sub);
  if (p.sup) md.use(sup);
  if (p.mark) md.use(mark);
  if (p.deflist) md.use(deflist);
  if (p.multimdTable) md.use(multimdTable, {
    multiline: true,
    rowspan: true,
    headerless: true,
  });
  if (p.alerts) md.use(alert);
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
