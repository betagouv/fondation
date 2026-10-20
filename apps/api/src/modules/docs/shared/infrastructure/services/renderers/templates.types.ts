import type { SafeHtml } from './safe-html';

export type TemplateFunction<Ctx extends Record<string, unknown>> = (ctx: Ctx) => SafeHtml;

export class Template<Context extends Record<string, unknown>> {
  // oxlint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  $type: Context;

  constructor(private readonly template: (ctx: Context) => string) {}

  render(ctx: Context): string {
    return this.template(ctx);
  }
}
