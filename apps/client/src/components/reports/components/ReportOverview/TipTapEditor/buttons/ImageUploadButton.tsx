import Button from '@codegouvfr/react-dsfr/Button';
import { useCurrentEditor } from '@tiptap/react';
import type { ChangeEvent, FC } from 'react';
import { useRef } from 'react';
import { useIsBlurred } from '../useIsBlurred';
import type { InsertImages } from '..';

type ImageUploadButtonProps = {
  insertImages: InsertImages;
};

export const ImageUploadButton: FC<ImageUploadButtonProps> = ({ insertImages }) => {
  const { editor } = useCurrentEditor();
  const isBlurred = useIsBlurred();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    insertImages(editor, [...files]);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
        multiple
        onChange={handleFileChange}
        aria-label="Insérer une image"
        className="hidden"
        style={{ display: 'none' }}
      />
    </>
  );
};
