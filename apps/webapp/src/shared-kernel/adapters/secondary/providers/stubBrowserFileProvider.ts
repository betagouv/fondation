import { InvalidMimeTypeError } from "../../../core-logic/errors/InvalidMimeType.error";
import { FileProvider } from "../../../core-logic/providers/fileProvider";

export class StubBrowserFileProvider implements FileProvider {
  mimeType?: string = undefined;

  async bufferFromFile(file: File): Promise<ArrayBuffer> {
    return file.arrayBuffer();
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
