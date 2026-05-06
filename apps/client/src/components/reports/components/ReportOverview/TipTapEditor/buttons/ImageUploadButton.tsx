import { useCurrentEditor } from '@tiptap/react';
import React from 'react';

import { EditorButton } from './EditorButton';

export const ImageUploadButton: React.FC = () => {
  const { editor } = useCurrentEditor();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleClick = React.useCallback(() => {
    fileInputRef.current?.click();
  }, [fileInputRef]);

  const handleFileChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      editor?.commands.uploadFiles({ files: e.target.files });

      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [editor, fileInputRef],
  );

  if (!editor || !editor.can().uploadFiles?.()) {
    return null;
  }

  return (
    <>
      <EditorButton
        onClick={handleClick}
        title="Ajouter une capture d'écran"
        iconId="fr-icon-image-add-line"
        disabled={false}
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
