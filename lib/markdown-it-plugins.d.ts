// These markdown-it plugins ship without type declarations and have no @types package.

declare module 'markdown-it-task-lists' {
  import type { MarkdownIt } from 'markdown-it';
  const taskLists: (
    md: MarkdownIt,
    options?: { enabled?: boolean; label?: boolean; labelAfter?: boolean }
  ) => void;
  export default taskLists;
}

declare module 'markdown-it-sub' {
  import type { MarkdownIt } from 'markdown-it';
  const sub: (md: MarkdownIt) => void;
  export default sub;
}

declare module 'markdown-it-sup' {
  import type { MarkdownIt } from 'markdown-it';
  const sup: (md: MarkdownIt) => void;
  export default sup;
}

declare module 'markdown-it-mark' {
  import type { MarkdownIt } from 'markdown-it';
  const mark: (md: MarkdownIt) => void;
  export default mark;
}

declare module 'markdown-it-deflist' {
  import type { MarkdownIt } from 'markdown-it';
  const deflist: (md: MarkdownIt) => void;
  export default deflist;
}
