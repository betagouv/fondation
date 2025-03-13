import { Editor } from "@tiptap/react";
import { useRef } from "react";
import { ReportFileUsage } from "shared-models";
import { deleteReportAttachedFile } from "../../../../../core-logic/use-cases/report-attached-file-deletion/delete-report-attached-file";
import { useAppDispatch, useAppSelector } from "../../../hooks/react-redux";
import { selectReport } from "../../../selectors/selectReport";

export type UseOnDeletedImage = (reportId: string) => {
  onCreate: (editor: Editor) => void;
  onUpdate: (editor: Editor) => void;
};

export const useOnDeletedImage: UseOnDeletedImage = (reportId) => {
  const previousScreenshots = useRef<string[]>([]);
  const dispatch = useAppDispatch();
  const filesSM = useAppSelector(
    (state) => selectReport(state, reportId)?.attachedFiles,
  );

  const onCreate = (editor: Editor) => {
    const content = editor.getJSON().content;

    if (content) {
      previousScreenshots.current = content
        .filter((item) => item.type === "image")
        .map((item) => item.attrs!.src);
    }
  };

  const onUpdate = (editor: Editor) => {
    const content = editor.getJSON().content;

    if (content) {
      const currentScreenshots = content
        ?.filter((item) => item.type === "image" && item.attrs)
        .map((item) => item.attrs!.src);

      const deletedImages = previousScreenshots.current.filter(
        (url) => !currentScreenshots.includes(url),
      );
      for (const url of deletedImages) {
        const fileSMToDelete = filesSM?.find((f) => f.signedUrl === url)?.name;
        if (!fileSMToDelete) {
          console.warn("Fichier à supprimer non trouvé.");
          continue;
        }

        dispatch(
          deleteReportAttachedFile({
            fileName: fileSMToDelete,
            reportId,
            usage: ReportFileUsage.EMBEDDED_SCREENSHOT,
            addScreenshotToEditor: (fileUrl) => {
              return editor.chain().focus().setImage({ src: fileUrl }).run();
            },
          }),
        );
      }

      previousScreenshots.current = currentScreenshots;
    }
  };

  return {
    onCreate,
    onUpdate,
  };
};
