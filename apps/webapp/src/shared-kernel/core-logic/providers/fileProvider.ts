import { fileTypeFromBuffer, FileTypeResult } from "file-type";

export class FileProvider {
  async bufferFromBrowserFile(file: File): Promise<ArrayBuffer> {
    const fileBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
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
}
