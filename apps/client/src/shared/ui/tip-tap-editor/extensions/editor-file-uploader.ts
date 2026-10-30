import type { Editor } from '@tiptap/core';

import { dataFileIdKey, dataFileNameKey, isVideo } from './constant';

export type FilesUploader = (files: readonly File[]) => Promise<{ id: string; url: URL; name: string }[]>;

const PREVIEW_NODE = 'imagePreview';

function previewOf(editor: Editor, fileName: string) {
  return editor.$nodes(PREVIEW_NODE)?.find(($node) => $node.attributes['dataFileName'] === fileName);
}

export function makeEditorFilesUploader(uploader: FilesUploader) {
  return function (options: { editor: Editor; files: readonly File[]; pos?: number }) {
    const { editor } = options;
    let uploadDone = false;
    const files = options.files.map((file) => {
      const ext = file.name.split('.').at(-1);
      if (!ext) return file;

      const fileName = [crypto.randomUUID(), ext].join('.');
      return new File([file], fileName, { type: file.type });
    });

    for (const file of files) {
      // a video waits without a picture: its first frame would need the whole file
      const preview = isVideo(file)
        ? Promise.resolve({})
        : readAsImage(file).then(($img) => ({ height: $img.height, src: $img.src, width: $img.width }));

      preview
        .then((attrs) => {
          if (uploadDone) return;

          const node = { attrs: { ...attrs, dataFileName: file.name }, type: PREVIEW_NODE };
          if (options.pos !== undefined && options.pos !== null) {
            editor.commands.insertContentAt(options.pos, node);
          } else {
            editor.commands.insertContent(node);
          }
        })
        .catch(() => {});
    }

    uploader(files)
      .then((uploadedFiles) => {
        uploadDone = true;
        for (const { id: fileId, name, url } of uploadedFiles) {
          const file = files.find((f) => f.name === name);
          const content = {
            attrs: { src: url.toString(), [dataFileIdKey]: fileId, [dataFileNameKey]: name },
            type: file && isVideo(file) ? 'video' : 'image',
          };

          const $preview = previewOf(editor, name);
          if ($preview) {
            editor
              .chain()
              .deleteRange({ from: $preview.pos, to: $preview.pos + $preview.size })
              .insertContentAt($preview.pos, content)
              .run();
          } else {
            editor.commands.insertContent(content);
          }
        }
      })
      .catch(() => {
        uploadDone = true;
        for (const file of files) {
          const $preview = previewOf(editor, file.name);
          if ($preview) editor.commands.deleteRange({ from: $preview.pos, to: $preview.pos + $preview.size });
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
