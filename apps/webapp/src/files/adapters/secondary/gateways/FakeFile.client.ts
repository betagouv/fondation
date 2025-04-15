import { FileVM } from "shared-models";
import { FileApiClient } from "../../../core-logic/gateways/File.client";

export class FakeFileApiClient implements FileApiClient {
  private files: Record<string, FileVM> = {};

  async getSignedUrls(ids: string[]): Promise<FileVM[]> {
    return ids.map((id) => this.files[id]!);
  }

  addFiles(files: ({ fileId: string } & FileVM)[]) {
    files.forEach((file) => {
      const { fileId, ...fileWithoutId } = file;
      this.files[fileId] = fileWithoutId;
    });
  }

  setFiles(...files: ({ fileId: string } & FileVM)[]) {
    this.files = {};
    this.addFiles(files);
  }
}
