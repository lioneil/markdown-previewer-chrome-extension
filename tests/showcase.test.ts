import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createMarkdownRenderer } from '@/lib/markdown';

/**
 * showcase.md has an example of every feature, so any change to its rendered
 * HTML is a change readers will see. When a dependency update fails this test,
 * read the snapshot diff, then update the snapshot with `npx vitest run -u`.
 */
describe('showcase', () => {
  it('renders the same HTML as the stored snapshot', async () => {
    const markdown = readFileSync(resolve(process.cwd(), 'showcase.md'), 'utf8');
    await expect(createMarkdownRenderer().render(markdown)).toMatchFileSnapshot(
      '__snapshots__/showcase.html'
    );
  });
});
