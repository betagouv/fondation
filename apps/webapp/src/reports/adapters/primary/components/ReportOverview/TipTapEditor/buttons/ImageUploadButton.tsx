import Button from "@codegouvfr/react-dsfr/Button";
import { useCurrentEditor } from "@tiptap/react";
import { ChangeEvent, FC, useRef } from "react";
import { useIsBlurred } from "../useIsBlurred";

export const ImageUploadButton: FC = () => {
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

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        editor.chain().focus().setImage({ src: event.target.result }).run();
      }
    };
    reader.readAsDataURL(file);
    // Reset input to allow selecting the same file again
    e.target.value = "";
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
