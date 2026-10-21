import Button from '@codegouvfr/react-dsfr/Button';
import Bold from '@tiptap/extension-bold';
import Document from '@tiptap/extension-document';
import Italic from '@tiptap/extension-italic';
import { Paragraph } from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { UndoRedo } from '@tiptap/extensions';
import { EditorContent, EditorContext, useEditor, useEditorState } from '@tiptap/react';
import { useId, useState, type ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { DocBlockEditedLine } from '@/features/documents/components/blocks/DocBlockEditedBadge';
import { Modal } from '@/shared/ui/modal';
import { BoldButton, ItalicButton } from '@/shared/ui/tip-tap-editor';
import {
  useDeleteOfficialReportFileNoteMutation,
  useEditOfficialReportFileNoteMutation,
} from '@queries/agenda.queries';

import type { OfficialReportBlock } from './official-report-blocks.type';

type OfficialReportFileNoteState = Extract<OfficialReportBlock, { kind: 'file' }>['note'];

export function OfficialReportFileNote(props: {
  agendaAction: ReactNode;
  nominationFileId: string;
  note: OfficialReportFileNoteState;
  officialReportId: string;
  onStored: (note: OfficialReportFileNoteState) => void;
  sessionId: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDeletion, setIsConfirmingDeletion] = useState(false);

  const mutation = { officialReportId: props.officialReportId, sessionId: props.sessionId };
  const edition = useEditOfficialReportFileNoteMutation(mutation);
  const deletion = useDeleteOfficialReportFileNoteMutation(mutation);

  const save = async (html: string) => {
    props.onStored(await edition.mutateAsync({ html, nominationFileId: props.nominationFileId }));
    setIsEditing(false);
  };

  const remove = async () => {
    props.onStored(await deletion.mutateAsync({ nominationFileId: props.nominationFileId }));
    setIsConfirmingDeletion(false);
  };

  return (
    <div contentEditable={false}>
      {props.note && !isEditing && (
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

      {isEditing && (
        <OfficialReportFileNoteEditor
          hasFailed={edition.isError}
          initialHtml={props.note?.html ?? ''}
          isSaving={edition.isPending}
          onCancel={() => {
            edition.reset();
            setIsEditing(false);
          }}
          onSave={(html) => void save(html).catch(() => {})}
        />
      )}

      <div className="flex flex-wrap justify-end">
        {props.agendaAction}
        {!isEditing &&
          (props.note ? (
            <>
              <Button
                iconId="fr-icon-edit-line"
                iconPosition="right"
                onClick={() => setIsEditing(true)}
                priority="tertiary no outline"
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
              size="small"
            >
              <FormattedMessage defaultMessage="Ajouter une information sous le bloc" />
            </Button>
          ))}
      </div>

      <OfficialReportFileNoteDeleteModal
        hasFailed={deletion.isError}
        isDeleting={deletion.isPending}
        onClose={() => setIsConfirmingDeletion(false)}
        onClosed={deletion.reset}
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
  onSave: (html: string) => void;
}) {
  const labelId = useId();

  const editor = useEditor({
    autofocus: 'end',
    content: props.initialHtml,
    editorProps: { attributes: { 'aria-labelledby': labelId, class: 'fr-p-2v min-h-20 outline-none' } },
    extensions: [Document, Paragraph, Text, Bold, Italic, UndoRedo],
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

function OfficialReportFileNoteDeleteModal(props: {
  hasFailed: boolean;
  isDeleting: boolean;
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
        <FormattedMessage defaultMessage="L'information ajoutée sous cette proposition sera retirée du PV. Vous pourrez en ajouter une nouvelle." />
      </p>
    </Modal>
  );
}
