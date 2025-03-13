import { useCurrentEditor } from "@tiptap/react";
import { useEffect } from "react";
import { ReportFileUsage } from "shared-models";
import { attachReportFile } from "../../../../../core-logic/use-cases/report-attach-file/attach-report-file";
import { useAppDispatch, useAppSelector } from "../../../hooks/react-redux";

export const useScreenshotPaste = (reportId: string) => {
  const { editor } = useCurrentEditor();
  const dispatch = useAppDispatch();
  const currentTimestamp = useAppSelector(
    (state) => state.sharedKernel.currentTimestamp,
  );

  useEffect(() => {
    if (!editor) return;

    const insertImage = (file: File) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (typeof event.target?.result === "string") {
          const fileToUpload = new File(
            [await file.arrayBuffer()],
            `${file.name}-${currentTimestamp}`,
            {
              type: file.type,
            },
          );

          dispatch(
            attachReportFile({
              usage: ReportFileUsage.EMBEDDED_SCREENSHOT,
              file: fileToUpload,
              reportId,
              addScreenshotToEditor: (fileUrl) => {
                return editor
                  .chain()
                  .focus()
                  .setImage({
                    // @ts-expect-error cet attribut est ajouté
                    // lors de la customisation de l'extension Image
                    fileId: "my-test-file-id",
                    src: fileUrl,
                  })
                  .run();
              },
            }),
          );
        }
      };
      reader.readAsDataURL(file);
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
