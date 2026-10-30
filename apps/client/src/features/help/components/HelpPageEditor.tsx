import Button from '@codegouvfr/react-dsfr/Button';
import { generateHTML, generateJSON } from '@tiptap/core';
import { useCallback, useMemo } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { useRequestFailure } from '@/shared/hooks/useRequestFailure';
import { type FilesUploader, TipTapEditor, useTipTapExtensions } from '@/shared/ui/tip-tap-editor';
import { useToasts } from '@/shared/ui/toast';
import { type HelpPageEnum, useIncludeFilesInHelpPageContentMutation } from '@queries/help.queries';

const UPLOAD_FAILURES = defineMessages({
  // see IMAGE_MAX_BYTES and VIDEO_MAX_BYTES in apps/api/src/modules/help/infrastructure/help.dto.ts
  refused: { defaultMessage: 'Une image pèse 5 Mo au plus, une vidéo mp4 ou webm 50 Mo au plus.' },
  timeout: { defaultMessage: "L'envoi a dépassé 5 minutes : la connexion est trop lente pour ce fichier." },
});

export function HelpPageEditor(props: {
  ariaLabelledby: string;
  content: string;
  /** null once the writing matches the page again */
  onDraftChange: (draft: string | null) => void;
  onPreview: () => void;
  page: HelpPageEnum;
}) {
  const { content, onDraftChange, page } = props;
  const { formatMessage } = useIntl();
  const toasts = useToasts();
  const describeFailure = useRequestFailure({ ...UPLOAD_FAILURES, tooLarge: UPLOAD_FAILURES.refused });
  const { mutateAsync: includeFiles } = useIncludeFilesInHelpPageContentMutation();
  // the stored html loses what the editor writes for itself, such as the class of a callout: the editor's own rendering is the reference
  const extensions = useTipTapExtensions({ features: 'page' });
  const baseline = useMemo(
    () => generateHTML(generateJSON(content, extensions), extensions),
    [content, extensions],
  );

  const uploadFiles: FilesUploader = useCallback(
    async (files: readonly File[]) => {
      const { items } = await includeFiles({ files, page }).catch((error: unknown) => {
        toasts.error({
          description: describeFailure(error),
          title: formatMessage({ defaultMessage: "Le fichier n'a pas pu être ajouté" }),
        });
        throw error;
      });
      return items.map(({ id, name, url }) => ({ id, name, url: new URL(url) }));
    },
    [describeFailure, formatMessage, includeFiles, page, toasts],
  );

  const onChange = useCallback(
    (next: string) => onDraftChange(next === baseline ? null : next),
    [baseline, onDraftChange],
  );

  // the frame of the tabs already outlines the editor
  return (
    <div className="[&_.ProseMirror]:min-h-[60vh] [&_.ProseMirror]:outline-none! [&>div]:pt-0!">
      <TipTapEditor
        ariaLabelledby={props.ariaLabelledby}
        autosave={false}
        features="page"
        onChange={onChange}
        toolbarEnd={
          <Button
            iconId="fr-icon-eye-line"
            onClick={props.onPreview}
            priority="tertiary no outline"
            size="small"
          >
            <FormattedMessage defaultMessage="Aperçu" />
          </Button>
        }
        uploadFiles={uploadFiles}
        value={content}
      />
    </div>
  );
}
