import Button from "@codegouvfr/react-dsfr/Button";
import { useCurrentEditor } from "@tiptap/react";
import { ChangeEvent, FC, useRef } from "react";
import { reportEmbedScreenshot } from "../../../../../../core-logic/use-cases/report-embed-screenshot/report-embed-screenshot";
import { useAppDispatch } from "../../../../hooks/react-redux";
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
    const file = e.target.files?.[0];
    if (!file) return;

    dispatch(
      reportEmbedScreenshot({
        file,
        reportId,
        editor,
      }),
    );
    if (fileInputRef.current) fileInputRef.current.value = "";
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
