import { Editor } from '@tiptap/react';
import { dataFileNameKey, fileKey } from '../reports/components/ReportOverview/TipTapEditor/extensions';

export class TipTapEditorProvider {
  constructor(private readonly editor: Editor) {}

  setImages(images: { file: File; signedUrl: string }[]): boolean {
    let chained = this.editor.chain().focus();

    for (const { file, signedUrl } of images) {
      chained = chained.setImage({
        src: signedUrl,

        // Cet attribut est ajouté lors de la customisation de l'extension Image
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [dataFileNameKey as any]: file.name,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [fileKey as any]: file
      });
    }

    return chained.run();
  }

  async persistImages() {
    for (const n of this.editor.state.doc.toJSON().content) {
      if (n.type === 'image') {
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
