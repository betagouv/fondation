export interface FileProvider {
  bufferFromFile(file: File): Promise<ArrayBuffer>;

  mimeTypeFromBuffer(fileBuffer: ArrayBuffer): Promise<string | undefined>;

  assertMimeTypeFactory: (
    mimeTypesWhitelist: string[],
  ) => (file: File) => Promise<void>;
}
