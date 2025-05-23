import { Editor } from "@tiptap/react";
import { TextEditorProvider } from "../../../core-logic/providers/textEditor";
import {
  dataFileNameKey,
  fileKey,
} from "../../../../reports/adapters/primary/components/ReportOverview/TipTapEditor/extensions";
import { FileVM } from "shared-models";

export class TipTapEditorProvider implements TextEditorProvider {
  constructor(private readonly editor: Editor) {}

  setImages(images: { file: File; signedUrl: string }[]): boolean {
    let chained = this.editor.chain().focus();

    for (const { file, signedUrl } of images) {
      chained = chained.setImage({
        // Cet attribut est ajouté lors de la customisation de l'extension Image
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [dataFileNameKey as any]: file.name,
        src: signedUrl,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [fileKey as any]: file,
      });
    }

    return chained.run();
  }

  replaceImageUrls(fileVMs: FileVM[]) {
    // Le remplacement des src via l'API TipTap provoquait des bugs
    // lors de l'undo-redo d'ajouts/suppressions d'images.
    const imgs = document.querySelectorAll(
      ".ProseMirror img",
    ) as NodeListOf<HTMLImageElement>;
    imgs.forEach(replaceSrc(fileVMs));
  }

  async persistImages() {
    for (const n of this.editor.state.doc.toJSON().content) {
      if (n.type === "image") {
        const fileName = n.attrs[dataFileNameKey];
        const file = this.editor.storage.image.files[fileName];
        if (!file) {
          const response = await fetch(n.attrs.src);
          const data = await response.blob();
          const fetchedFile = new File([data], fileName, { type: data.type });
          this.editor.storage.image.files[fileName] = fetchedFile;
        }
      }
    }
  }

  isEmpty(): boolean {
    return this.editor.isEmpty;
  }
}

function replaceSrc(signedUrlsVM: FileVM[]): (value: HTMLImageElement) => void {
  return (img) => {
    const imgFileName = img.getAttribute(dataFileNameKey);
    const signedUrlVM = signedUrlsVM.find((file) => file.name === imgFileName);

    if (signedUrlVM) {
      img.setAttribute("src", signedUrlVM.signedUrl);
    }
  };
}
