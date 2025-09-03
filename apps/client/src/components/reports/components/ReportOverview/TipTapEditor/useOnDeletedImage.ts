import { Editor, type JSONContent } from '@tiptap/react';
import { useRef } from 'react';
import type { DeleteImages } from '.';
import { dataFileNameKey } from './extensions';

export type UseOnDeletedImage = (deleteImages: DeleteImages) => {
  onCreate: (editor: Editor) => void;
  onUpdate: (editor: Editor) => Promise<void>;
};

export const useOnDeletedImage: UseOnDeletedImage = (deleteImages) => {
  const previousImages = useRef<string[]>([]);

  const onCreate = (editor: Editor) => {
    const content = editor.getJSON().content;

    if (content) {
      previousImages.current = imagesFileNamesFromContent(content);
    }
  };

  const onUpdate = async (editor: Editor) => {
    const content = editor.getJSON().content;

    if (content) {
      const currentImages = imagesFileNamesFromContent(content);

      const deletedImagesFileNames = previousImages.current.filter((name) => !currentImages.includes(name));

      previousImages.current = currentImages;

      if (deletedImagesFileNames.length) {
        await deleteImages(editor, deletedImagesFileNames);
      }
    }
  };

  return {
    onCreate,
    onUpdate
  };
};

const imagesFileNamesFromContent = (content: JSONContent[]): string[] =>
  content?.filter((item) => item.type === 'image' && item.attrs).map((item) => item.attrs![dataFileNameKey]);
