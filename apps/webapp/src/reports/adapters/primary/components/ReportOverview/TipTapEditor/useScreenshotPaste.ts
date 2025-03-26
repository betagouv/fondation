import { useCurrentEditor } from "@tiptap/react";
import { useEffect } from "react";
import { useAppDispatch } from "../../../hooks/react-redux";
import { InsertImages } from ".";

export const useScreenshotPaste = (insertImages: InsertImages) => {
  const { editor } = useCurrentEditor();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!editor) return;

    const handlePaste = (event: ClipboardEvent) => {
      // Prevent default to stop the image from being pasted as a file
      event.preventDefault();

      const items = event.clipboardData?.items;
      if (!items) return;

      const images = [...items]
        .filter((item) => item.type.indexOf("image") === 0)
        .map((item) => item.getAsFile())
        .filter((file): file is File => file !== null);
      insertImages(editor, images);
    };

    editor.view.dom.addEventListener("paste", handlePaste);

    return () => {
      editor.view.dom.removeEventListener("paste", handlePaste);
    };
  }, [dispatch, editor, insertImages]);
};
