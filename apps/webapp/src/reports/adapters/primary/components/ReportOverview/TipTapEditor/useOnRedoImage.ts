import { Transaction } from "@tiptap/pm/state";
import { Editor, JSONContent } from "@tiptap/react";
import { useRef } from "react";
import { RedoImages } from ".";
import { dataFileNameKey } from "./extensions";

export type UseOnRedoImage = (redoImages: RedoImages) => {
  onCreate: (editor: Editor) => void;
  onUpdate: (editor: Editor, transaction: Transaction) => void;
};

export const useOnRedoImage: UseOnRedoImage = (redoImages) => {
  const previousImageNames = useRef<string[]>([]);

  const onCreate = (editor: Editor) => {
    const content = editor.getJSON().content;

    if (content) {
      previousImageNames.current = imagesFileNamesFromContent(content);
    }
  };

  const onUpdate = async (editor: Editor, transaction: Transaction) => {
    const content = editor.getJSON().content;

    if (content) {
      const currentImageNames = imagesFileNamesFromContent(content);

      const addedImageNames = currentImageNames.filter(
        (name) =>
          !previousImageNames.current.find((prevName) => prevName === name),
      );
      const isRevertDeletion =
        !transaction.getMeta("setImage") && addedImageNames.length > 0;

      previousImageNames.current = currentImageNames;

      // TODO Supprimer après debug en staging
      if (isRevertDeletion) {
        console.debug(
          "useOnRedoImage update",
          "previousImageNames:",
          previousImageNames.current,
          "currentImageNames:",
          currentImageNames,
          "addedImageNames:",
          addedImageNames,
        );
        redoImages(
          editor,
          addedImageNames.map((name) => {
            const file = editor.storage.image.files[name];
            if (!file)
              throw new Error(
                `File with name ${name} not found in editor storage.`,
              );
            return file;
          }),
        );
      }
    }
  };

  return {
    onCreate,
    onUpdate,
  };
};

const imagesFileNamesFromContent = (content: JSONContent[]): string[] =>
  content
    ?.filter((item) => item.type === "image" && item.attrs)
    .map((item) => item.attrs![dataFileNameKey]);
