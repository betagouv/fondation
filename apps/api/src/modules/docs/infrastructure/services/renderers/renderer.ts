export interface Renderer<Context> {
  html(context: Context): Promise<string>;
  pdf(context: Context): Promise<Buffer>;
}
