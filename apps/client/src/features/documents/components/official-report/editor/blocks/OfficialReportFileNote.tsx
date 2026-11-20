import Badge from '@codegouvfr/react-dsfr/Badge';
import Button from '@codegouvfr/react-dsfr/Button';
import Bold from '@tiptap/extension-bold';
import Document from '@tiptap/extension-document';
import Italic from '@tiptap/extension-italic';
import { Paragraph } from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { UndoRedo } from '@tiptap/extensions';
import { EditorContent, EditorContext, useEditor, useEditorState } from '@tiptap/react';
import { useEffect, useId, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { DocBlockEditedLine } from '@/features/documents/components/blocks/DocBlockEditedBadge';
import { Modal } from '@/shared/ui/modal';
import { BoldButton, ItalicButton } from '@/shared/ui/tip-tap-editor';
import { Tooltip } from '@/shared/ui/tooltip';
import { requiresElision } from '@/utils/string.utils';
import {
  useDeleteOfficialReportFileNoteMutation,
  useEditOfficialReportFileNoteMutation,
  useResetOfficialReportFileNoteMutation,
} from '@queries/agenda.queries';

import type { OfficialReportBlock } from './official-report-blocks.type';

type OfficialReportFileNoteState = Extract<OfficialReportBlock, { kind: 'file' }>['note'];

export function OfficialReportFileNote(props: {
  name: string;
  nominationFileId: string;
  note: OfficialReportFileNoteState;
  officialReportId: string;
  onDraftChange: (html: string | null) => void;
  onStored: (note: OfficialReportFileNoteState) => void;
  sessionId: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDeletion, setIsConfirmingDeletion] = useState(false);

  const mutation = { officialReportId: props.officialReportId, sessionId: props.sessionId };
  const edition = useEditOfficialReportFileNoteMutation(mutation);
  const deletion = useDeleteOfficialReportFileNoteMutation(mutation);
  const reset = useResetOfficialReportFileNoteMutation(mutation);
  const emptied = { ...props.note, editedAt: null, editedBy: null, html: null, outdatedBy: null };

  // the button that started the action is gone once it ends, so the focus would fall back on the page
  const actionRef = useRef<HTMLButtonElement>(null);
  const [focusRequest, setFocusRequest] = useState(0);
  useEffect(() => {
    if (focusRequest > 0) actionRef.current?.focus();
  }, [focusRequest]);
  const focusAction = () => setFocusRequest((request) => request + 1);

  const closeEditor = () => {
    props.onDraftChange(null);
    setIsEditing(false);
    focusAction();
  };

  const save = async (html: string) => {
    props.onStored(await edition.mutateAsync({ html, nominationFileId: props.nominationFileId }));
    closeEditor();
  };

  const remove = async () => {
    await deletion.mutateAsync({ nominationFileId: props.nominationFileId });
    props.onStored(emptied);
    setIsConfirmingDeletion(false);
  };

  // keeping the slot as it is writes it again: the text it reads, or nothing
  const ignore = async () => {
    const { html } = props.note;
    if (html) props.onStored(await edition.mutateAsync({ html, nominationFileId: props.nominationFileId }));
    else {
      await deletion.mutateAsync({ nominationFileId: props.nominationFileId });
      props.onStored(emptied);
    }
  };

  const restoreMention = async () => {
    await reset.mutateAsync({ nominationFileId: props.nominationFileId });
    props.onStored({ ...emptied, html: props.note.generatedHtml });
    focusAction();
  };
  const canRestoreMention =
    props.note.generatedHtml !== null &&
    props.note.html !== props.note.generatedHtml &&
    props.note.outdatedBy === null;

  return (
    <div contentEditable={false}>
      {props.note.html && !isEditing && (
        <div className="doc-block__read-only fr-mt-2v">
          {props.note.editedAt && (
            <span className="mb-3 flex">
              <DocBlockEditedLine
                at={props.note.editedAt}
                label={<FormattedMessage defaultMessage="information ajoutée dans le PV" />}
                tone="yellow"
                writer={props.note.editedBy}
              />
            </span>
          )}
          <div className="[&>:last-child]:mb-0!" dangerouslySetInnerHTML={{ __html: props.note.html }} />
        </div>
      )}

      {props.note.outdatedBy && !isEditing && (
        <OfficialReportFileNoteDriftBanner
          generatedHtml={props.note.generatedHtml}
          hasFailed={edition.isError || deletion.isError || reset.isError}
          isPending={edition.isPending || deletion.isPending || reset.isPending}
          onAccept={() => void restoreMention().catch(() => {})}
          onIgnore={() => void ignore().catch(() => {})}
          outdatedBy={props.note.outdatedBy}
        />
      )}

      {isEditing && (
        <OfficialReportFileNoteEditor
          hasFailed={edition.isError}
          initialHtml={props.note.html ?? ''}
          isSaving={edition.isPending}
          onCancel={() => {
            edition.reset();
            closeEditor();
          }}
          onDraftChange={props.onDraftChange}
          onSave={(html) => void save(html).catch(() => {})}
        />
      )}

      <div className="flex flex-wrap items-center justify-end">
        {canRestoreMention && reset.isError && (
          <p className="fr-error-text fr-mt-0 mr-auto" role="alert">
            <FormattedMessage defaultMessage="Le rétablissement a échoué" />
          </p>
        )}
        {!isEditing && canRestoreMention && (
          <Button
            disabled={reset.isPending}
            iconId="fr-icon-arrow-go-back-line"
            iconPosition="right"
            onClick={() => void restoreMention().catch(() => {})}
            priority="tertiary no outline"
            size="small"
          >
            <FormattedMessage defaultMessage="Rétablir la mention" />
          </Button>
        )}
        {!isEditing &&
          (props.note.html ? (
            <>
              <Button
                iconId="fr-icon-edit-line"
                iconPosition="right"
                onClick={() => setIsEditing(true)}
                priority="tertiary no outline"
                ref={actionRef}
                size="small"
              >
                <FormattedMessage defaultMessage="Modifier l'information" />
              </Button>
              <Button
                iconId="fr-icon-delete-line"
                iconPosition="right"
                onClick={() => setIsConfirmingDeletion(true)}
                priority="tertiary no outline"
                size="small"
              >
                <FormattedMessage defaultMessage="Supprimer l'information" />
              </Button>
            </>
          ) : (
            <Button
              iconId="fr-icon-edit-line"
              iconPosition="right"
              onClick={() => setIsEditing(true)}
              priority="tertiary no outline"
              ref={actionRef}
              size="small"
            >
              <FormattedMessage defaultMessage="Ajouter une information sous le bloc" />
            </Button>
          ))}
      </div>

      <OfficialReportFileNoteDeleteModal
        hasFailed={deletion.isError}
        isDeleting={deletion.isPending}
        mentionsRecusal={props.note.generatedHtml !== null}
        name={props.name}
        onClose={() => setIsConfirmingDeletion(false)}
        onClosed={() => {
          // the dialog gives the focus back to the delete button on closing, which a deletion removed
          if (deletion.isSuccess) focusAction();
          deletion.reset();
        }}
        onDelete={() => void remove().catch(() => {})}
        open={isConfirmingDeletion}
      />
    </div>
  );
}

function OfficialReportFileNoteEditor(props: {
  hasFailed: boolean;
  initialHtml: string;
  isSaving: boolean;
  onCancel: () => void;
  onDraftChange: (html: string | null) => void;
  onSave: (html: string) => void;
}) {
  const labelId = useId();
  const storedHtml = useRef<string | null>(null);

  const editor = useEditor({
    autofocus: 'end',
    content: props.initialHtml,
    editorProps: { attributes: { 'aria-labelledby': labelId, class: 'fr-p-2v min-h-20 outline-none' } },
    extensions: [Document, Paragraph, Text, Bold, Italic, UndoRedo],
    onCreate: ({ editor }) => {
      storedHtml.current = editor.getHTML();
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      props.onDraftChange(editor.getText().trim() && html !== storedHtml.current ? html : null);
    },
  });
  const isEmpty = useEditorState({ editor, selector: ({ editor }) => !editor?.getText().trim() });

  return (
    <div className="fr-mt-2v rounded border border-solid border-(--border-default-grey) bg-(--background-default-grey)">
      <EditorContext value={{ editor }}>
        <div className="fr-p-1v flex items-center gap-2 border-x-0 border-t-0 border-b border-solid border-(--border-default-grey)">
          <span className="fr-sr-only" id={labelId}>
            <FormattedMessage defaultMessage="Information à ajouter sous la proposition" />
          </span>
          <BoldButton />
          <ItalicButton />
        </div>
        <EditorContent editor={editor} />
      </EditorContext>

      <div className="fr-p-2v flex flex-wrap items-center justify-end gap-2">
        {props.hasFailed && (
          <p className="fr-error-text fr-mt-0 mr-auto" role="alert">
            <FormattedMessage defaultMessage="L'enregistrement a échoué" />
          </p>
        )}
        <Button onClick={props.onCancel} priority="secondary" size="small">
          <FormattedMessage defaultMessage="Annuler" />
        </Button>
        <Button
          disabled={isEmpty || props.isSaving}
          onClick={() => editor && props.onSave(editor.getHTML())}
          size="small"
        >
          <FormattedMessage defaultMessage="Enregistrer" />
        </Button>
      </div>
    </div>
  );
}

/**
 * the recusal, or only how a recused member is named, changed since the slot was written or emptied:
 * the reader keeps it or takes the mention
 */
function OfficialReportFileNoteDriftBanner(props: {
  generatedHtml: string | null;
  hasFailed: boolean;
  isPending: boolean;
  onAccept: () => void;
  onIgnore: () => void;
  outdatedBy: NonNullable<OfficialReportFileNoteState['outdatedBy']>;
}) {
  const { formatMessage } = useIntl();
  // a new cause breaks the build here rather than borrowing the words of another one
  const { badge, tooltip } = {
    DESIGNATION: {
      badge: formatMessage({ defaultMessage: 'la désignation a changé' }),
      tooltip: formatMessage({
        defaultMessage:
          "La désignation d'un membre déporté a changé depuis que l'information a été modifiée. Acceptez la mention proposée pour remplacer l'information, ignorez-la pour la conserver.",
      }),
    },
    RECUSAL: {
      badge: formatMessage({ defaultMessage: 'le déport a changé' }),
      tooltip: formatMessage({
        defaultMessage:
          "Le déport de ce dossier a changé depuis que l'information a été modifiée ou supprimée. Acceptez la mention proposée pour remplacer l'information, ignorez-la pour la conserver.",
      }),
    },
  }[props.outdatedBy];

  return (
    <div className="doc-block__banner doc-block__banner--info fr-mt-2v">
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Badge
          as="span"
          className="fr-mb-0 bg-(--background-alt-grey) text-(--text-default-grey)"
          noIcon
          small
        >
          {badge}
        </Badge>
        <Tooltip label={tooltip}>
          <i
            aria-hidden
            className="fr-icon-question-line fr-icon--sm text-(--text-action-high-blue-france)"
          />
        </Tooltip>
      </span>
      <div className="fr-mt-3v fr-mb-4v">
        {props.generatedHtml ? (
          <div className="[&>:last-child]:mb-0!" dangerouslySetInnerHTML={{ __html: props.generatedHtml }} />
        ) : (
          <p className="fr-mb-0">
            <FormattedMessage defaultMessage="Plus aucun membre n'est déporté sur ce dossier : aucune mention." />
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {props.hasFailed && (
          <p className="fr-error-text fr-mt-0 mr-auto" role="alert">
            <FormattedMessage defaultMessage="L'enregistrement a échoué" />
          </p>
        )}
        <Button disabled={props.isPending} onClick={props.onIgnore} priority="secondary" size="small">
          <FormattedMessage defaultMessage="Ignorer" />
        </Button>
        <Button disabled={props.isPending} onClick={props.onAccept} size="small">
          <FormattedMessage defaultMessage="Accepter" />
        </Button>
      </div>
    </div>
  );
}

function OfficialReportFileNoteDeleteModal(props: {
  hasFailed: boolean;
  isDeleting: boolean;
  mentionsRecusal: boolean;
  name: string;
  onClose: () => void;
  onClosed: () => void;
  onDelete: () => void;
  open: boolean;
}) {
  const { formatMessage } = useIntl();

  return (
    <Modal
      actions={
        <>
          {props.hasFailed && (
            <p className="fr-error-text fr-mt-0 mr-auto" role="alert">
              <FormattedMessage defaultMessage="La suppression a échoué" />
            </p>
          )}
          <Button onClick={props.onClose} priority="secondary">
            <FormattedMessage defaultMessage="Annuler" />
          </Button>
          <Button disabled={props.isDeleting} onClick={props.onDelete}>
            <FormattedMessage defaultMessage="Supprimer" />
          </Button>
        </>
      }
      onClose={props.onClose}
      onClosed={props.onClosed}
      open={props.open}
      title={formatMessage({ defaultMessage: "Supprimer l'information" })}
    >
      <p className="fr-mb-0">
        {props.mentionsRecusal ? (
          <FormattedMessage
            defaultMessage="Attention, vous êtes sur le point de supprimer une information de déport sous la proposition {elided, select, true {d’} other {de }}{name}. Les membres resteront déportés sur le dossier. Confirmez-vous votre action ?"
            values={{ elided: requiresElision(props.name), name: props.name }}
          />
        ) : (
          <FormattedMessage
            defaultMessage="L'information ajoutée sous la proposition {elided, select, true {d’} other {de }}{name} sera retirée du PV. Vous pourrez en ajouter une nouvelle."
            values={{ elided: requiresElision(props.name), name: props.name }}
          />
        )}
      </p>
    </Modal>
  );
}
