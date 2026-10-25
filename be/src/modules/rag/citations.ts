// API Contract 4.8
const LABEL_GROUP = /\[\s*(S\d+(?:\s*[,;]\s*S\d+)*)\s*\]/gi;
const MAX_PENDING = 40;

export const labelOf = (index: number) => `S${index + 1}`;

export class CitationRewriter {
  private pending = '';

  constructor(private readonly targets: ReadonlyMap<string, string>) {}

  push(text: string): string {
    const all = this.pending + text;
    const open = all.lastIndexOf('[');
    if (open >= 0 && !all.includes(']', open) && all.length - open <= MAX_PENDING) {
      this.pending = all.slice(open);
      return this.rewrite(all.slice(0, open));
    }
    this.pending = '';
    return this.rewrite(all);
  }

  flush(): string {
    const rest = this.pending;
    this.pending = '';
    return this.rewrite(rest);
  }

  private rewrite(text: string): string {
    return text.replace(LABEL_GROUP, (_, group: string) =>
      group
        .split(/[,;]/)
        .map((label) => this.targets.get(label.trim().toUpperCase()))
        .filter((target): target is string => Boolean(target))
        .map((target) => `[${target}]`)
        .join(''),
    );
  }
}
