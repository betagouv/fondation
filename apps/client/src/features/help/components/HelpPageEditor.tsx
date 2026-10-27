import Button from '@codegouvfr/react-dsfr/Button';
import { generateHTML, generateJSON } from '@tiptap/core';
import { useCallback, useMemo } from 'react';
import { FormattedMessage } from 'react-intl';

import { type FilesUploader, TipTapEditor, useTipTapExtensions } from '@/shared/ui/tip-tap-editor';
import { type HelpPageEnum, useIncludeFilesInHelpPageContentMutation } from '@queries/help.queries';

export function HelpPageEditor(props: {
  ariaLabelledby: string;
  content: string;
  /** null once the writing matches the page again */
  onDraftChange: (draft: string | null) => void;
  onPreview: () => void;
  page: HelpPageEnum;
}) {
  const { content, onDraftChange, page } = props;
  const { mutateAsync: includeFiles } = useIncludeFilesInHelpPageContentMutation();
  // the stored html loses what the editor writes for itself, such as the class of a callout: the editor's own rendering is the reference
  const extensions = useTipTapExtensions({ features: 'page' });
  const baseline = useMemo(
    () => generateHTML(generateJSON(content, extensions), extensions),
    [content, extensions],
  );

  const uploadFiles: FilesUploader = useCallback(
    async (files: readonly File[]) => {
      const { items } = await includeFiles({ files, page });
      return items.map(({ id, name, url }) => ({ id, name, url: new URL(url) }));
    },
    [includeFiles, page],
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
            iconPosition="right"
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
