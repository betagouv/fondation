import Button from '@codegouvfr/react-dsfr/Button';
import type { UseMutationResult } from '@tanstack/react-query';
import clsx from 'clsx';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import { DocumentEditor } from './DocumentEditor';
import { DocumentIframe, type DocumentIframeHandle } from './DocumentIframe';

export function DocumentPreviewLayout(props: {
  title: string;
  html: string | undefined | null;
  isPending: boolean;
  updateContentMutation: UseMutationResult<unknown, Error, { html: string }>;
  validateMutation: UseMutationResult<unknown, Error, void>;
}) {
  const iframeRef = React.useRef<DocumentIframeHandle>(null);
  const [iframeKey, setIframeKey] = React.useState('iframe_key_' + crypto.randomUUID());

  const [isEditing, setEditing] = React.useState(false);
  const [editorHtml, setEditorHtml] = React.useState<string | null>(null);

  const isDirty = React.useMemo(() => editorHtml !== null, [editorHtml]);

  const { isPending: isUpdatePending, mutate: updateHtml } = props.updateContentMutation;
  const { isPending: isValidating, mutate: validate } = props.validateMutation;

  const isValidationPending = isUpdatePending || isValidating;

  const onEdit = React.useCallback(() => {
    setEditing(true);
  }, []);

  const onCancel = React.useCallback(() => {
    setEditing(false);
    setEditorHtml(null);
    setIframeKey(crypto.randomUUID());
  }, []);

  const onHtmlChange = React.useCallback((html: string) => {
    setEditorHtml(html);
    iframeRef.current?.updateContent(html);
  }, []);

  const onValidate = React.useCallback(() => {
    if (isDirty && editorHtml) {
      updateHtml({ html: editorHtml }, { onSuccess: () => validate() });
    } else {
      validate();
    }
  }, [isDirty, editorHtml, updateHtml, validate]);

  return (
    <div
      className={clsx('mx-auto flex h-[calc(100svh-3rem)] max-w-7xl flex-col pt-5', {
        'fr-container': !isEditing,
      })}
    >
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between">
        <h1 className="mb-0">{props.title}</h1>
        {!isEditing && props.html && !props.isPending && (
          <Button priority="secondary" iconId="fr-icon-edit-line" iconPosition="left" onClick={onEdit}>
            <FormattedMessage defaultMessage="Éditer" />
          </Button>
        )}
      </div>

      <div className="mt-6 flex min-h-0 flex-1 gap-6">
        {!props.isPending && isEditing && (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto xl:flex-2">
            <DocumentEditor html={props.html} title={props.title} onHtmlChange={onHtmlChange} />
          </div>
        )}

        <div
          className={clsx('min-h-0 flex-col overflow-auto', {
            'hidden md:flex md:flex-1 xl:flex-3': isEditing,
            'flex w-full md:mx-auto md:w-4xl': !isEditing,
          })}
        >
          {props.isPending || !props.html ? (
            <i className="ri-loader-4-line m-auto animate-spin text-[2rem]" />
          ) : (
            <DocumentIframe
              ref={iframeRef}
              reloadKey={iframeKey}
              html={props.html}
              title={props.title}
              className="h-full w-full border border-solid border-gray-100"
            />
          )}
        </div>
      </div>

      <div className="flex justify-center gap-4 bg-white px-4 py-6">
        {isEditing && (
          <Button priority="secondary" onClick={onCancel} disabled={isValidationPending}>
            <FormattedMessage defaultMessage="Annuler" />
          </Button>
        )}
        <Button
          disabled={isValidationPending}
          iconId={isValidationPending ? 'ri-loader-4-line' : 'fr-icon-success-fill'}
          iconPosition="right"
          onClick={onValidate}
        >
          {isEditing ? (
            <FormattedMessage defaultMessage="Sauvegarder" />
          ) : (
            <FormattedMessage defaultMessage="Valider le document" />
          )}
        </Button>
      </div>
    </div>
  );
}
