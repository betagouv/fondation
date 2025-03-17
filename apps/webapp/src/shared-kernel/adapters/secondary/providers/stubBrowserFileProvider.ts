import { FileProvider } from "../../../core-logic/providers/fileProvider";

export class StubBrowserFileProvider implements FileProvider {
  mimeType?: string = undefined;

  async bufferFromFile(file: File): Promise<ArrayBuffer> {
    return file.arrayBuffer();
  }

  async mimeTypeFromBuffer() {
    return this.mimeType;
  }
}
