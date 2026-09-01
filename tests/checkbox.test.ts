import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMarkdownRenderer } from '@/lib/markdown';

const sendMessage = vi.fn();

function decodeSaved(): string {
  const { dataUrl } = sendMessage.mock.calls.at(-1)![0];
  return decodeURIComponent(escape(atob(dataUrl.replace(/^data:text\/markdown;base64,/, ''))));
}

/** Render markdown into the page the way the content script does, then wire it up. */
async function mount(markdown: string) {
  vi.resetModules();
  document.body.innerHTML = `<article class="md-body">${createMarkdownRenderer().render(markdown)}</article>`;
  const { initCheckboxes } = await import('@/lib/checkbox');
  initCheckboxes(markdown);
  return {
    boxes: [...document.querySelectorAll<HTMLInputElement>('.md-body input[type="checkbox"]')],
    bar: document.querySelector('.checkbox-save-bar')!,
    save: document.querySelector<HTMLButtonElement>('.checkbox-save-btn')!,
  };
}

function toggle(box: HTMLInputElement) {
  box.checked = !box.checked;
  box.dispatchEvent(new Event('change'));
}

beforeEach(() => {
  sendMessage.mockReset();
  vi.stubGlobal('chrome', { runtime: { sendMessage } });
  document.body.innerHTML = '';
});

describe('save bar', () => {
  it('appears when an unordered checkbox is toggled', async () => {
    const { boxes, bar } = await mount('- [ ] one\n');
    expect(bar.classList.contains('visible')).toBe(false);
    toggle(boxes[0]);
    expect(bar.classList.contains('visible')).toBe(true);
  });

  it('appears when an ordered checkbox is toggled', async () => {
    const { boxes, bar } = await mount('1. [ ] one\n2. [ ] two\n');
    toggle(boxes[0]);
    expect(bar.classList.contains('visible')).toBe(true);
  });

  it('appears when a checkbox inside a blockquote is toggled', async () => {
    const { boxes, bar } = await mount('> - [ ] one\n');
    toggle(boxes[0]);
    expect(bar.classList.contains('visible')).toBe(true);
  });
});

describe('saved source', () => {
  it('checks the line the ordered item came from', async () => {
    const md = '# Doc\n\n1. [ ] one\n2. [ ] two\n';
    const { boxes, save } = await mount(md);
    toggle(boxes[1]);
    save.click();
    expect(decodeSaved()).toBe('# Doc\n\n1. [ ] one\n2. [x] two\n');
  });

  it('unchecks a checked item', async () => {
    const md = '- [x] one\n';
    const { boxes, save } = await mount(md);
    toggle(boxes[0]);
    save.click();
    expect(decodeSaved()).toBe('- [ ] one\n');
  });

  it('ignores task syntax inside a fenced code block', async () => {
    const md = ['```markdown', '- [ ] fenced', '```', '', '- [ ] real', ''].join('\n');
    const { boxes, save } = await mount(md);
    expect(boxes).toHaveLength(1);
    toggle(boxes[0]);
    save.click();
    expect(decodeSaved()).toBe(
      ['```markdown', '- [ ] fenced', '```', '', '- [x] real', ''].join('\n')
    );
  });

  it('tracks the right line across mixed list styles', async () => {
    const md = ['- [ ] a', '', '1. [ ] b', '', '> * [ ] c', ''].join('\n');
    const { boxes, save } = await mount(md);
    toggle(boxes[2]);
    save.click();
    expect(decodeSaved()).toBe(['- [ ] a', '', '1. [ ] b', '', '> * [x] c', ''].join('\n'));
  });
});
