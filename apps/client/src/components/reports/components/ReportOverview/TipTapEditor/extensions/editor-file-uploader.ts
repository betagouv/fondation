import type { Editor } from '@tiptap/core';
import { dataFileIdKey, dataFileNameKey } from './constant';

export type FilesUploader = (
  files: readonly { id: string; file: File }[]
) => Promise<{ id: string; fileId: string; url: URL; name: string }[]>;

export function makeEditorImageUploader(uploader: FilesUploader) {
  return function (options: { editor: Editor; files: readonly File[]; pos?: number }) {
    const filesWithId = options.files.map((file) => ({ file, id: crypto.randomUUID() }));
    let uploadDone = false;

    for (const { id, file } of filesWithId) {
      readAsImage(file)
        .then(($img) => {
          if (uploadDone) return;

          /** @see {@link } */
          const node = {
            type: 'imagePreview',
            attrs: {
              src: $img.src,
              width: $img.width,
              height: $img.height,
              dataFileId: id
            }
          };

          if (options.pos !== undefined && options.pos !== null) {
            options.editor.commands.insertContentAt(options.pos, node);
          } else {
            options.editor.commands.insertContent(node);
          }
        })
        .catch(() => {});
    }

    uploader(filesWithId).then((uploadedFiles) => {
      uploadDone = true;
      for (const { id, fileId, name, url } of uploadedFiles) {
        const content = {
          type: 'image',
          attrs: { src: url.toString(), [dataFileIdKey]: fileId, [dataFileNameKey]: name }
        };

        let found = false;
        const $nodes = options.editor.$nodes(`imagePreview`) ?? [];
        for (const $node of $nodes) {
          if ($node.attributes['dataFileId'] === id) {
            found = true;
            const pos = $node.pos;

            options.editor
              .chain()
              .deleteRange({ from: pos, to: pos + $node.size })
              .insertContentAt(pos, content)
              .run();
          }
        }

        if (!found) {
          options.editor.commands.insertContent(content);
        }
      }
    });
  };
}

function readAsImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      if (typeof reader.result !== 'string') {
        return reject(new Error('error while reading'));
      }

      const $img = document.createElement('img');
      $img.src = reader.result;
      $img.style.display = 'none';

      $img.addEventListener('load', () => {
        $img.remove();
        resolve($img);
      });

      document.body.appendChild($img);
    });

    reader.readAsDataURL(file);
  });
}
