import { html as indented, oneLine } from 'common-tags';

const ENTITIES: Readonly<Record<string, string>> = {
  '"': '&quot;',
  '&': '&amp;',
  "'": '&#39;',
  '<': '&lt;',
  '>': '&gt;',
};

export function escapeHtml(text: string): string {
  return text.replace(/["&'<>]/g, (character) => ENTITIES[character]!);
}

/** a fragment already written in HTML, which a template inserts as is */
export class SafeHtml {
  constructor(private readonly value: string) {}

  static join(fragments: readonly SafeHtml[], separator = ''): SafeHtml {
    return new SafeHtml(fragments.join(separator));
  }

  toString(): string {
    return this.value;
  }
}

function escaped(value: unknown): unknown {
  if (value === null || value === undefined) return '';
  if (value instanceof SafeHtml) return value.toString();
  if (Array.isArray(value)) return value.map(escaped);
  return typeof value === 'string' ? escapeHtml(value) : value;
}

function escaping(tag: (strings: TemplateStringsArray, ...values: unknown[]) => string) {
  return (strings: TemplateStringsArray, ...values: unknown[]): SafeHtml =>
    new SafeHtml(tag(strings, ...values.map(escaped)));
}

/** escapes every inserted value but a `SafeHtml`, and puts the template on one line */
export const html = escaping(oneLine);

/** escapes every inserted value but a `SafeHtml`, and keeps the template's lines without their indentation */
export const indentedHtml = escaping(indented);
