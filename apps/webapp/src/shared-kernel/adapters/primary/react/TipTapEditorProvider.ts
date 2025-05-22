import { Editor } from "@tiptap/react";
import { TextEditorProvider } from "../../../core-logic/providers/textEditor";
import { dataFileNameKey } from "../../../../reports/adapters/primary/components/ReportOverview/TipTapEditor/extensions";

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
      });
    }

    return chained.run();
  }

  isEmpty(): boolean {
    return this.editor.isEmpty;
  }
}
