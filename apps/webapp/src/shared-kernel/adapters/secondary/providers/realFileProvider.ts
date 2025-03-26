import { fileTypeFromBuffer, FileTypeResult } from "file-type";
import { InvalidMimeTypeError } from "../../../core-logic/errors/InvalidMimeType.error";
import { FileProvider } from "../../../core-logic/providers/fileProvider";

export class RealFileProvider implements FileProvider {
  async bufferFromFile(file: File): Promise<ArrayBuffer> {
    const fileBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.onabort = () => reject(new Error("File reading aborted"));

      reader.readAsArrayBuffer(file);
    });

    return fileBuffer;
  }

  async mimeTypeFromBuffer(
    fileBuffer: ArrayBuffer,
  ): Promise<FileTypeResult["mime"] | undefined> {
    const fileType = await fileTypeFromBuffer(fileBuffer);
    return fileType?.mime;
  }

  assertMimeTypeFactory(mimeTypesWhitelist: string[]) {
    return async (file: File) => {
      const fileBuffer = await this.bufferFromFile(file);
      const mimeType = await this.mimeTypeFromBuffer(fileBuffer);

      if (!mimeType || !mimeTypesWhitelist.includes(mimeType)) {
        throw new InvalidMimeTypeError({
          fileName: file.name,
        });
      }
    };
  }
}
