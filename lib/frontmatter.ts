import type { MarkdownIt, StateBlock } from 'markdown-it';
import { load, FAILSAFE_SCHEMA } from 'js-yaml';

type Escape = (s: string) => string;

function isFence(state: StateBlock, line: number, marks: string[]): boolean {
  const text = state.src.slice(state.bMarks[line], state.eMarks[line]).trimEnd();
  return marks.includes(text);
}

function renderValue(value: unknown, escape: Escape): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        const text = item !== null && typeof item === 'object' ? JSON.stringify(item) : String(item);
        return `<span class="frontmatter-chip">${escape(text)}</span>`;
      })
      .join('');
  }
  if (typeof value === 'object') return `<code>${escape(JSON.stringify(value))}</code>`;
  const text = String(value);
  if (/^https?:\/\/\S+$/.test(text)) return `<a href="${escape(text)}">${escape(text)}</a>`;
  return escape(text);
}

export function frontmatter(md: MarkdownIt): void {
  md.block.ruler.before('hr', 'frontmatter', (state, startLine, endLine, silent) => {
    if (startLine !== 0 || state.parentType !== 'root' || !isFence(state, 0, ['---'])) return false;

    let close = 1;
    while (close < endLine && !isFence(state, close, ['---', '...'])) close++;
    if (close >= endLine) return false;

    const body = state.getLines(1, close, 0, false);
    // Plain Markdown can open with a horizontal rule, so only YAML-looking bodies are claimed.
    // A line starting with two or more hashes counts as a Markdown heading, not a YAML comment.
    const firstLine = body.split('\n').find((l) => l.trim() !== '' && !/^#(?!#)/.test(l.trim()));
    const looksLikeYaml = firstLine !== undefined && /^[\w"'-][^:\n]*:(\s|$)/.test(firstLine);
    let data: unknown;
    try {
      data = body.trim() === '' ? null : load(body, { schema: FAILSAFE_SCHEMA });
    } catch {
      if (!looksLikeYaml) return false;
      if (silent) return true;
      // Show the broken block as source so the reader can see what to fix.
      const token = state.push('fence', 'code', 0);
      token.info = 'yaml';
      token.markup = '```';
      token.content = body;
      token.map = [0, close + 1];
      state.line = close + 1;
      return true;
    }

    const isMapping = data !== null && typeof data === 'object' && !Array.isArray(data);
    if (data !== null && data !== undefined && !isMapping) return false;
    if (silent) return true;

    const token = state.push('frontmatter', '', 0);
    token.meta = (data ?? {}) as Record<string, unknown>;
    token.map = [0, close + 1];
    token.block = true;
    state.line = close + 1;
    return true;
  });

  md.renderer.rules.frontmatter = (tokens, idx) => {
    const entries = Object.entries(tokens[idx].meta as Record<string, unknown>);
    if (entries.length === 0) return '';
    const escape = md.utils.escapeHtml;
    const rows = entries
      .map(
        ([key, value]) =>
          `<li><span class="frontmatter-key">${escape(key)}</span>:: <span class="frontmatter-value">${renderValue(value, escape)}</span></li>`
      )
      .join('\n');
    return `<section class="frontmatter" aria-label="Metadata">\n<p class="frontmatter-title">Metadata</p>\n<ul>\n${rows}\n</ul>\n</section>\n`;
  };
}
