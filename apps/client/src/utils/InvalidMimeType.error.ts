export class InvalidMimeTypeError extends Error {
  constructor(args: { fileName: string; mimeType?: string }) {
    super(`Invalid mime type for file ${args.fileName}: ${args.mimeType || ''}`);
  }
}
