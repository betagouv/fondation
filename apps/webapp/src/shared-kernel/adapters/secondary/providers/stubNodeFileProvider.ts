import { InvalidMimeTypeError } from "../../../core-logic/errors/InvalidMimeType.error";
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

  assertMimeTypeFactory(mimeTypesWhitelist: string[]) {
    return async (file: File) => {
      if (!this.mimeType || !mimeTypesWhitelist.includes(this.mimeType)) {
        throw new InvalidMimeTypeError({
          fileName: file.name,
        });
      }
    };
  }
}
