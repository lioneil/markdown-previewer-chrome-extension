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
