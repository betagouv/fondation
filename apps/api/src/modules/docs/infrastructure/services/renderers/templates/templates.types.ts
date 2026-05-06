export type TemplateFunction<Ctx extends Record<string, unknown>> = (
  ctx: Ctx,
) => string;

export class Template<Context extends Record<string, unknown>> {
  // oxlint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  $type: Context;

  constructor(private readonly template: TemplateFunction<Context>) {}

  render(ctx: Context): string {
    return this.template(ctx);
  }
}
