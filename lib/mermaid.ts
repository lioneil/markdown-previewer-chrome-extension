import type { ResolvedTheme } from './theme';

let idCounter = 0;
let lastInitTheme: ResolvedTheme | null = null;

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function renderContainers(
  containers: NodeListOf<HTMLElement> | HTMLElement[],
  theme: ResolvedTheme,
): Promise<void> {
  const mermaid = (await import('mermaid')).default;

  // Initialize once per theme, not per container
  if (lastInitTheme !== theme) {
    mermaid.initialize({
      startOnLoad: false,
      theme: theme === 'dark' ? 'dark' : 'default',
      fontFamily: '-apple-system, "system-ui", "Segoe UI", Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
      gantt: {
        useMaxWidth: false,
        useWidth: 1200,
        leftPadding: 250,
        rightPadding: 100,
        topPadding: 60,
        barHeight: 24,
        barGap: 6,
        fontSize: 13,
        sectionFontSize: 14,
      },
      pie: {
        useMaxWidth: false,
        useWidth: 1200,
        textPosition: 0.85,
      },
      xyChart: {
        useMaxWidth: false,
        width: 1200,
        height: 600,
        xAxis: {
          labelPadding: 15,
          titlePadding: 20,
        },
        yAxis: {
          labelPadding: 15,
          titlePadding: 60,
        },
        plotReservedSpacePercent: 60,
      },
    });
    lastInitTheme = theme;
  }

  for (const container of containers) {
    if (container.classList.contains('error')) continue;

    const source = decodeURIComponent(container.getAttribute('data-mermaid') ?? '');
    if (!source.trim()) continue;

    try {
      const id = `mermaid-${idCounter++}`;
      const { svg } = await mermaid.render(id, source);
      container.innerHTML = svg;

      // Mermaid sometimes computes a viewBox that clips content (e.g. long
      // pie chart titles). Expand the viewBox to fit all rendered elements.
      const svgEl = container.querySelector('svg');
      if (svgEl) {
        const bbox = svgEl.getBBox();
        const pad = 10;
        svgEl.setAttribute(
          'viewBox',
          `${bbox.x - pad} ${bbox.y - pad} ${bbox.width + pad * 2} ${bbox.height + pad * 2}`,
        );
      }

      container.classList.add('rendered');
    } catch {
      container.innerHTML = `
        <div class="mermaid-error">
          <span class="mermaid-error-label">Diagram rendering failed</span>
          <pre><code>${escapeHtml(source)}</code></pre>
        </div>
      `;
      container.classList.add('error');
    }
  }
}

export async function renderMermaidDiagrams(theme: ResolvedTheme): Promise<void> {
  const containers = document.querySelectorAll<HTMLElement>('.mermaid-container');
  if (containers.length === 0) return;
  await renderContainers(containers, theme);
}

export async function rerenderMermaidDiagrams(theme: ResolvedTheme): Promise<void> {
  const containers = document.querySelectorAll<HTMLElement>('.mermaid-container');
  if (containers.length === 0) return;

  // Reset rendered containers
  containers.forEach((c) => {
    if (c.classList.contains('error')) return;
    c.classList.remove('rendered');
    c.innerHTML = '';
  });

  idCounter = 0;
  lastInitTheme = null;
  await renderContainers(Array.from(containers), theme);
}
