import Button from "@codegouvfr/react-dsfr/Button";
import { useCurrentEditor } from "@tiptap/react";
import { ChangeEvent, FC, useRef } from "react";
import { ReportFileUsage } from "shared-models";
import { attachReportFile } from "../../../../../../core-logic/use-cases/report-attach-file/attach-report-file";
import { useAppDispatch } from "../../../../hooks/react-redux";
import { dataFileNameKey } from "../extensions";
import { useIsBlurred } from "../useIsBlurred";

export const ImageUploadButton: FC<{ reportId: string }> = ({ reportId }) => {
  const { editor } = useCurrentEditor();
  const isBlurred = useIsBlurred();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useAppDispatch();

  if (!editor) return null;

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const insertImage = (file: File) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (typeof event.target?.result === "string") {
          const currentTimestamp = Date.now();

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
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    [dataFileNameKey as any]: fileToUpload.name,
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
    const file = e.target.files?.[0];
    if (!file) return;
    insertImage(file);
  };

  return (
    <>
      <Button
        onClick={handleClick}
        size="medium"
        iconId="fr-icon-image-add-line"
        priority="tertiary"
        title="Ajouter une capture d'écran"
        disabled={isBlurred}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        aria-label="Insérer une image"
        className="hidden"
        style={{ display: "none" }}
      />
    </>
  );
};
