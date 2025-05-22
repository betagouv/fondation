export interface TextEditorProvider {
  setImages: (images: { file: File; signedUrl: string }[]) => boolean;

  isEmpty: () => boolean;
}
