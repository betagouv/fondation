export type TemplateFunction<Ctx extends Record<string, unknown>> = (
  ctx: Ctx,
) => string;

export class Template<Context extends Record<string, unknown>> {
  $type: Context;

  constructor(private readonly template: TemplateFunction<Context>) {}

  render(ctx: Context): string {
    return this.template(ctx);
  }
}
