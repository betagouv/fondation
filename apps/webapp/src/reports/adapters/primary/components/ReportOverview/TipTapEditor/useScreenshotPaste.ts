import { useCurrentEditor } from "@tiptap/react";
import { useEffect } from "react";
import { useAppDispatch } from "../../../hooks/react-redux";
import { InsertImage } from ".";

export const useScreenshotPaste = (insertImage: InsertImage) => {
  const { editor } = useCurrentEditor();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!editor) return;

    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i]!.type.indexOf("image") === 0) {
          const blob = items[i]!.getAsFile();
          if (blob) {
            insertImage(editor, blob);
            // Prevent default to stop the image from being pasted as a file
            event.preventDefault();
            break;
          }
        }
      }
    };

    editor.view.dom.addEventListener("paste", handlePaste);

    return () => {
      editor.view.dom.removeEventListener("paste", handlePaste);
    };
  }, [dispatch, editor, insertImage]);
};
