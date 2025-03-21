export interface FileProvider {
  bufferFromFile(file: File): Promise<ArrayBuffer>;

  mimeTypeFromBuffer(fileBuffer: ArrayBuffer): Promise<string | undefined>;
}
