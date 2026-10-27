import { useCurrentEditor } from '@tiptap/react';
import React from 'react';
import { useIntl } from 'react-intl';

import { type EditorFeatures, IMAGE_MIME_TYPES, VIDEO_MIME_TYPES } from '../extensions/constant';

import { EditorButton } from './EditorButton';

export function ImageUploadButton(props: { features: EditorFeatures }) {
  const { formatMessage } = useIntl();
  const { editor } = useCurrentEditor();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const withVideos = props.features === 'page';

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

  const title = withVideos
    ? formatMessage({ defaultMessage: 'Ajouter une image ou une vidéo' })
    : formatMessage({ defaultMessage: "Ajouter une capture d'écran" });

  return (
    <>
      <EditorButton disabled={false} iconId="fr-icon-image-add-line" onClick={handleClick} title={title} />
      <input
        accept={[...IMAGE_MIME_TYPES, ...(withVideos ? VIDEO_MIME_TYPES : [])].join(',')}
        aria-label={title}
        className="hidden"
        multiple
        onChange={handleFileChange}
        ref={fileInputRef}
        style={{ display: 'none' }}
        type="file"
      />
    </>
  );
}
