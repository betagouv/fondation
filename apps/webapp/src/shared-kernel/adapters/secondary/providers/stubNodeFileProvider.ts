import { FileProvider } from "../../../core-logic/providers/fileProvider";
import { Buffer } from "node:buffer";

export class StubNodeFileProvider implements FileProvider {
  mimeType?: string = undefined;

  async bufferFromFile(): Promise<ArrayBuffer> {
    return Buffer.from("fake buffer");
  }

  async mimeTypeFromBuffer() {
    return this.mimeType;
  }
}
