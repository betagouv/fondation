import { FileVM } from "shared-models";

export interface TextEditorProvider {
  setImages: (images: { file: File; signedUrl: string }[]) => boolean;

  replaceImageUrls(fileVMs: FileVM[]): void;

  persistImages: () => Promise<void>;

  isEmpty: () => boolean;
}
