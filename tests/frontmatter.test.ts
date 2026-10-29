import { describe, expect, it } from 'vitest';
import { createMarkdownRenderer } from '@/lib/markdown';

function render(markdown: string): string {
  return createMarkdownRenderer().render(markdown);
}

const sample = [
  '---',
  'title: Serve to the network with --http and open the browser with --open',
  'type: feature',
  'priority: Low',
  'reporter: lioneil',
  'labels: [Quality of Life]',
  'created: 2026-10-29T22:10:53+08:00',
  'updated: 2026-10-29T22:14:41+08:00',
  '---',
  '',
  '# Heading',
  '',
].join('\n');

describe('frontmatter', () => {
  it('renders a metadata card before the body', () => {
    const html = render(sample);
    expect(html.startsWith('<section class="frontmatter" aria-label="Metadata">')).toBe(true);
    expect(html).toContain('<p class="frontmatter-title">Metadata</p>');
    expect(html).toContain('<span class="frontmatter-key">priority</span>:: <span class="frontmatter-value">Low</span>');
    expect(html).toContain('<h1');
    expect(html).not.toContain('<hr');
    expect(html).not.toContain('<h2');
  });

  it('prints values exactly as written', () => {
    const html = render(sample);
    expect(html).toContain('2026-10-29T22:10:53+08:00');
    expect(html).toContain('Serve to the network with --http and open the browser with --open');
  });

  it('renders list values as chips', () => {
    expect(render(sample)).toContain('<span class="frontmatter-chip">Quality of Life</span>');
    expect(render('---\ntags:\n  - one\n  - two\n---\n')).toContain(
      '<span class="frontmatter-chip">one</span><span class="frontmatter-chip">two</span>'
    );
  });

  it('links URL values', () => {
    expect(render('---\nsource: https://example.com/a?b=1&c=2\n---\n')).toContain(
      '<a href="https://example.com/a?b=1&amp;c=2">https://example.com/a?b=1&amp;c=2</a>'
    );
  });

  it('shows nested mappings as inline JSON', () => {
    expect(render('---\nauthor:\n  name: Ann\n  id: 7\n---\n')).toContain(
      '<code>{&quot;name&quot;:&quot;Ann&quot;,&quot;id&quot;:&quot;7&quot;}</code>'
    );
  });

  it('escapes HTML in keys and values', () => {
    const html = render('---\n"<b>k</b>": <script>alert(1)</script>\n---\n');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<b>k</b>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('renders nothing for an empty block', () => {
    expect(render('---\n---\n\ntext\n')).toBe('<p>text</p>\n');
  });

  it('shows invalid YAML as a yaml code block', () => {
    const html = render('---\nkey: [unclosed\n---\n\nbody\n');
    expect(html).toContain('<code class="language-yaml">');
    expect(html).toContain('<p>body</p>');
    expect(html).not.toContain('frontmatter');
  });

  it('leaves a document without a closing fence alone', () => {
    const html = render('---\n\nSome text\n');
    expect(html).toBe('<hr>\n<p>Some text</p>\n');
  });

  it('leaves a block whose body is not a mapping alone', () => {
    const html = render('---\njust a sentence\n---\n');
    expect(html).not.toContain('frontmatter');
    expect(html).toContain('<hr');
  });

  it('only matches at the top of the document', () => {
    const html = render('intro\n\n---\na: 1\n---\n');
    expect(html).not.toContain('frontmatter');
  });

  it('keeps task list source lines pointing at the full file', () => {
    const html = render('---\na: 1\nb: 2\nc: 3\n---\n\n- [ ] one\n- [x] two\n');
    const lines = [...html.matchAll(/data-source-line="(\d+)"/g)].map((m) => Number(m[1]));
    expect(lines).toEqual([6, 7]);
  });

  it('leaves a heading between two rules to markdown', () => {
    const html = render('---\n# Title\n---\n');
    expect(html).toContain('<h1');
    expect(html).not.toContain('language-yaml');
    expect(html).not.toContain('frontmatter');
  });

  it('leaves prose between two rules to markdown', () => {
    const html = render('---\n## Intro\nSome text: with colon\n- item\n---\n\nmore\n');
    expect(html).toContain('<h2');
    expect(html).not.toContain('language-yaml');
  });

  it('prints scalars exactly as written', () => {
    const html = render('---\nversion: 1.10\nid: 007\nflag: True\n---\n');
    expect(html).toContain('>1.10<');
    expect(html).toContain('>007<');
    expect(html).toContain('>True<');
  });
});
