import { FileVM } from "shared-models";
import { TextEditorProvider } from "../../../core-logic/providers/textEditor";

export class StubEditorProvider implements TextEditorProvider {
  setImagesSuccess = true;
  imagesUrls: { name: string; url: string }[] = [];

  setImages(): boolean {
    return this.setImagesSuccess;
  }

  replaceImageUrls(fileVMs: FileVM[]) {
    this.imagesUrls = fileVMs.map((file) => ({
      name: file.name,
      url: file.signedUrl,
    }));
  }

  async persistImages() {
    throw new Error("Method not implemented.");
  }

  isEmpty(): boolean {
    return false;
  }
}
