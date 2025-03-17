import { Editor, JSONContent } from "@tiptap/react";
import { useRef } from "react";
import { deleteReportAttachedFiles } from "../../../../../core-logic/use-cases/report-attached-files-deletion/delete-report-attached-file";
import { useAppDispatch } from "../../../hooks/react-redux";
import { dataFileNameKey } from "./extensions";

export type UseOnDeletedImage = (reportId: string) => {
  onCreate: (editor: Editor) => void;
  onUpdate: (editor: Editor) => void;
};

export const useOnDeletedImage: UseOnDeletedImage = (reportId) => {
  const previousImages = useRef<string[]>([]);
  const dispatch = useAppDispatch();

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

      const deletedImagesFileNames = previousImages.current.filter(
        (name) => !currentImages.includes(name),
      );

      if (deletedImagesFileNames.length)
        await dispatch(
          deleteReportAttachedFiles({
            fileNames: deletedImagesFileNames,
            reportId,
            addScreenshotToEditor: ({ fileUrl, fileName }) =>
              editor
                .chain()
                .focus()
                .setImage({
                  // Cet attribut est ajouté lors de la customisation de l'extension Image
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  [dataFileNameKey as any]: fileName,
                  src: fileUrl,
                })
                .run(),
          }),
        );

      previousImages.current = currentImages;
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
