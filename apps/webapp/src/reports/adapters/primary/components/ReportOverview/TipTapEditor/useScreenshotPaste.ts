import { useCurrentEditor } from "@tiptap/react";
import { useEffect } from "react";
import { reportEmbedScreenshot } from "../../../../../core-logic/use-cases/report-embed-screenshot/report-embed-screenshot";
import { useAppDispatch } from "../../../hooks/react-redux";

export const useScreenshotPaste = (reportId: string) => {
  const { editor } = useCurrentEditor();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!editor) return;

    const insertImage = (file: File) => {
      dispatch(
        reportEmbedScreenshot({
          file,
          reportId,
          editor,
        }),
      );
    };

    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i]!.type.indexOf("image") === 0) {
          const blob = items[i]!.getAsFile();
          if (blob) {
            insertImage(blob);
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
  }, [dispatch, editor, reportId]);
};
