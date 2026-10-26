import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMarkdownRenderer } from '@/lib/markdown';
import { enhanceCodeBlocks } from '@/lib/code-blocks';

const css = readFileSync(resolve(process.cwd(), 'assets/content.css'), 'utf8');

function mount(markdown: string) {
  document.body.innerHTML = `<article class="md-body">${createMarkdownRenderer().render(markdown)}</article>`;
  enhanceCodeBlocks(document);
}

function clipboard() {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  return writeText;
}

beforeEach(() => {
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
});

describe('code block copy button', () => {
  it('adds a copy button to a fenced block', () => {
    mount('```js\nconst x = 1;\n```\n');
    const btn = document.querySelector('.copy-btn');
    expect(btn).not.toBeNull();
    expect(btn?.getAttribute('title')).toBe('Copy code');
  });

  it('keeps the button at the top-right of the well when the line overflows', () => {
    mount('```js\nconst value = "' + 'x'.repeat(400) + '";\n```\n');
    const btn = document.querySelector<HTMLElement>('.copy-btn')!;
    const label = document.querySelector('.code-lang')!;
    const pre = document.querySelector('pre')!;
    const well = btn.closest('.code-block')!;

    expect(pre.contains(btn)).toBe(false);
    expect(pre.contains(label)).toBe(false);
    expect(well.contains(pre)).toBe(true);

    const btnStyle = getComputedStyle(btn);
    const preStyle = getComputedStyle(pre);
    const wellStyle = getComputedStyle(well);

    expect(btnStyle.position).toBe('absolute');
    expect(btnStyle.top).toBe('8px');
    expect(btnStyle.right).toBe('8px');
    expect(preStyle.overflowX).toBe('auto');
    expect(wellStyle.position).toBe('relative');
    expect(['auto', 'scroll']).not.toContain(wellStyle.overflowX);
  });

  it('draws the check in when the code is copied', () => {
    clipboard();
    mount('```\nconst x = 1;\n```\n');
    const btn = document.querySelector<HTMLButtonElement>('.copy-btn')!;
    const check = btn.querySelector<SVGPathElement>('.copy-icon-check path');
    expect(check).not.toBeNull();
    expect(check!.getAttribute('pathLength')).toBe('1');
    expect(check!.getAttribute('d')).toBe('M4 12 9 17 20 6');
    btn.click();
    expect(btn.querySelector('.copy-icon-copy')).not.toBeNull();
    const rule = [...document.styleSheets[0].cssRules].find(
      (entry) => entry instanceof CSSStyleRule && entry.selectorText === '.md-body .copy-btn.copied .copy-icon-check path',
    ) as CSSStyleRule | undefined;
    expect(rule?.style.animation).toContain('copy-check-draw');
  });

  it('copies that block’s source text', () => {
    const writeText = clipboard();
    mount('```js\nconst x = 1;\n```\n\n```\nplain\n```\n');
    const buttons = [...document.querySelectorAll<HTMLButtonElement>('.copy-btn')];
    buttons[1].click();
    expect(writeText).toHaveBeenCalledWith('plain\n');
    expect(buttons[1].classList.contains('copied')).toBe(true);
  });

  it('does not add a second button when run again', () => {
    mount('```\nconst x = 1;\n```\n');
    enhanceCodeBlocks(document);
    expect(document.querySelectorAll('.copy-btn')).toHaveLength(1);
  });
});
