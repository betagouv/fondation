export type AbstractTemplateContext = Record<
  string,
  string | Record<string, string>[]
>;

export class Template<Context extends AbstractTemplateContext> {
  private readonly _context: Context = {} as unknown as Context;

  constructor(private readonly template: string) {}

  toString(): string {
    return this.template;
  }
}
