// These markdown-it plugins ship without type declarations and have no @types package.

declare module 'markdown-it-task-lists' {
  import type { PluginWithOptions } from 'markdown-it';
  const taskLists: PluginWithOptions<{ enabled?: boolean; label?: boolean; labelAfter?: boolean }>;
  export default taskLists;
}

declare module 'markdown-it-sub' {
  import type { PluginSimple } from 'markdown-it';
  const sub: PluginSimple;
  export default sub;
}

declare module 'markdown-it-sup' {
  import type { PluginSimple } from 'markdown-it';
  const sup: PluginSimple;
  export default sup;
}

declare module 'markdown-it-mark' {
  import type { PluginSimple } from 'markdown-it';
  const mark: PluginSimple;
  export default mark;
}

declare module 'markdown-it-deflist' {
  import type { PluginSimple } from 'markdown-it';
  const deflist: PluginSimple;
  export default deflist;
}
