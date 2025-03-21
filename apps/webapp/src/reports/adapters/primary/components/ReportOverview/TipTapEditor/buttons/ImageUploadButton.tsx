import Button from "@codegouvfr/react-dsfr/Button";
import { useCurrentEditor } from "@tiptap/react";
import { ChangeEvent, FC, useRef } from "react";
import { InsertImage } from "..";
import { useIsBlurred } from "../useIsBlurred";

type ImageUploadButtonProps = {
  insertEditorImage: InsertImage;
};

export const ImageUploadButton: FC<ImageUploadButtonProps> = ({
  insertEditorImage,
}) => {
  const { editor } = useCurrentEditor();
  const isBlurred = useIsBlurred();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    insertEditorImage(editor, file);
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
