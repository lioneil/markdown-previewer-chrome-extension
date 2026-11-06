import { describe, expect, it } from 'vitest';
import { createMarkdownRenderer } from '@/lib/markdown';

/**
 * The rendered task-list item must carry the source line it came from, so the
 * checkbox handler never has to re-parse the markdown to find it again.
 */
function sourceLines(markdown: string): number[] {
  const html = createMarkdownRenderer().render(markdown);
  return [...html.matchAll(/<li class="task-list-item[^"]*" data-source-line="(\d+)"/g)].map((m) =>
    Number(m[1])
  );
}

function checkboxCount(markdown: string): number {
  const html = createMarkdownRenderer().render(markdown);
  return (html.match(/task-list-item-checkbox/g) ?? []).length;
}

describe('task list source lines', () => {
  it('stamps unordered items', () => {
    expect(sourceLines('- [ ] one\n- [x] two\n')).toEqual([0, 1]);
  });

  it('stamps ordered items', () => {
    expect(sourceLines('1. [ ] one\n2. [x] two\n')).toEqual([0, 1]);
  });

  it('stamps items in a blockquote', () => {
    expect(sourceLines('> - [ ] one\n> - [x] two\n')).toEqual([0, 1]);
  });

  it('stamps nested items', () => {
    expect(sourceLines('- [ ] one\n  - [ ] two\n')).toEqual([0, 1]);
  });

  it('skips task syntax inside a fenced code block', () => {
    const md = '```markdown\n- [ ] fenced\n```\n\n- [ ] real\n';
    expect(checkboxCount(md)).toBe(1);
    expect(sourceLines(md)).toEqual([4]);
  });

  it('stamps every item of a document that mixes list styles', () => {
    const md = ['- [ ] a', '', '1. [ ] b', '', '> * [x] c', ''].join('\n');
    expect(sourceLines(md)).toEqual([0, 2, 4]);
  });
});

describe('math', () => {
  const render = (src: string) => createMarkdownRenderer().render(src);

  it('renders inline $...$ as KaTeX', () => {
    const html = render('a $x^2$ b');
    expect(html).toContain('<span class="katex">');
    expect(html).not.toContain('katex-display');
  });

  it('renders $$...$$ on one line and across lines as display math', () => {
    for (const src of ['$$x^2$$', '$$\nx^2\n$$']) {
      const html = render(src);
      expect(html).toContain('katex-block');
      expect(html).toContain('katex-display');
    }
  });

  it('keeps currency as text', () => {
    const html = render('It costs $5 and $10, or $ 10 later.');
    expect(html).not.toContain('katex');
    expect(html).toContain('$5 and $10');
  });

  it('keeps an escaped dollar as text', () => {
    const html = render('cost \\$5 and \\$10');
    expect(html).not.toContain('katex');
    expect(html).toContain('$5 and $10');
  });

  it('leaves math syntax inside code spans and fences alone', () => {
    expect(render('`$x$`')).toContain('<code>$x$</code>');
    const fenced = render('```\n$$x$$\n```');
    expect(fenced).not.toContain('katex');
    expect(fenced).toContain('$$x$$');
  });

  it('shows bad TeX as an error span and keeps rendering the page', () => {
    const inline = render('before $\\frac{$ after\n\nnext paragraph');
    expect(inline).toContain('katex-error');
    expect(inline).toContain('next paragraph');
    const block = render('$$\n\\frac{\n$$\n\nnext paragraph');
    expect(block).toContain('katex-error');
    expect(block).toContain('next paragraph');
  });

  it('does not open math directly after a word character', () => {
    expect(render('a$x$b')).not.toContain('katex');
    expect(render('foo$x$')).not.toContain('katex');
  });

  it('does not close math directly before a word character', () => {
    expect(render('$x$s')).not.toContain('katex');
  });

  it('leaves text after a closing $$ on the same line as plain text', () => {
    const html = render('$$x$$ trailing');
    expect(html).not.toContain('katex');
    expect(html).toContain('$$x$$ trailing');
  });

  it('keeps rendering the page when KaTeX throws something other than a parse error', () => {
    const deep = `$${'{'.repeat(2000)}x${'}'.repeat(2000)}$`;
    const inline = render(`before\n\nsee ${deep} here\n\nnext paragraph`);
    expect(inline).toContain('katex-error');
    expect(inline).toContain('next paragraph');
    const block = render(`$$${'{'.repeat(2000)}x${'}'.repeat(2000)}$$\n\nnext paragraph`);
    expect(block).toContain("<p class='katex-block katex-error'");
    expect(block).toContain('next paragraph');
  });

  it('renders math wrapped in asterisks but not in underscores', () => {
    expect(render('*$x$*')).toContain('<em><span class="katex">');
    expect(render('_$x$_')).toBe('<p><em>$x$</em></p>\n');
  });

  it('does not let an unclosed $$ swallow the rest of the document', () => {
    const html = render('$$\nx\n\nnext paragraph\n\n# Heading');
    expect(html).toContain('<h1');
    expect(html).toContain('next paragraph');
    expect(html).not.toContain('katex');
  });

  it('is off when the katex setting is off', () => {
    const html = createMarkdownRenderer({ katex: false }).render('$x^2$');
    expect(html).not.toContain('katex');
    expect(html).toContain('$x^2$');
  });
});
