import Button from '@codegouvfr/react-dsfr/Button';
import Input from '@codegouvfr/react-dsfr/Input';
import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { useRequestFailure } from '@/shared/hooks/useRequestFailure';
import { Modal } from '@/shared/ui/modal';
import { RequiredLabel } from '@/shared/ui/required-label';
import { splitFileName } from '@/utils/file.utils';

// see renamedFileName in apps/api/src/modules/framework/files: the extension counts in it
const FILE_NAME_MAX_LENGTH = 255;

// see ObservationAttachmentsLocked, SummaryAttachmentsLocked and CantUpdateNominationFiles: the mutation then reloads the attachments
const FAILURES = defineMessages({
  conflict: {
    defaultMessage: 'Le dossier a été figé entre-temps : ses pièces jointes ne se renomment plus.',
  },
});

export function RenameAttachmentModal(props: {
  name: string;
  onClose: () => void;
  onClosed: () => void;
  open: boolean;
  rename: (name: string) => Promise<unknown>;
}) {
  const { formatMessage } = useIntl();
  const describeFailure = useRequestFailure(FAILURES);
  const formId = useId();
  const { extension, label } = splitFileName(props.name);

  const [name, setName] = useState(label);
  const [isPending, setIsPending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setIsPending(true);
    setFailure(null);
    try {
      await props.rename(name.trim());
      props.onClose();
    } catch (error) {
      setFailure(describeFailure(error));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Modal
      actions={
        <>
          <Button onClick={props.onClose} priority="secondary" type="button">
            <FormattedMessage defaultMessage="Annuler" />
          </Button>
          <Button disabled={isPending || !name.trim()} nativeButtonProps={{ form: formId }} type="submit">
            <FormattedMessage defaultMessage="Renommer" />
          </Button>
        </>
      }
      onClose={props.onClose}
      onClosed={props.onClosed}
      open={props.open}
      title={<FormattedMessage defaultMessage="Renommer la pièce jointe" />}
    >
      <form id={formId} onSubmit={submit}>
        <Input
          addon={
            extension && (
              <span className="flex items-center bg-(--background-contrast-grey) px-3 text-(--text-mention-grey)">
                .{extension}
              </span>
            )
          }
          hintText={
            extension &&
            formatMessage({ defaultMessage: "L'extension .{extension} est conservée." }, { extension })
          }
          label={
            <RequiredLabel>
              <FormattedMessage defaultMessage="Nom de la pièce jointe" />
            </RequiredLabel>
          }
          nativeInputProps={{
            autoComplete: 'off',
            maxLength: FILE_NAME_MAX_LENGTH - (extension ? extension.length + 1 : 0),
            onChange: (event) => setName(event.target.value),
            required: true,
            value: name,
          }}
          state={failure ? 'error' : 'default'}
          stateRelatedMessage={failure}
        />
      </form>
    </Modal>
  );
}

/** the renamed file outlives the closing, for the modal to fade out with its content */
export function useRenameAttachmentModal<T extends { id: string; name: string }>(
  rename: (file: T, name: string) => Promise<unknown>,
): { modal: ReactNode; open: (file: T) => void } {
  const [renaming, setRenaming] = useState<{ file: T; open: boolean } | null>(null);

  return {
    modal: renaming && (
      <RenameAttachmentModal
        key={renaming.file.id}
        name={renaming.file.name}
        onClose={() => setRenaming((current) => current && { ...current, open: false })}
        onClosed={() => setRenaming(null)}
        open={renaming.open}
        rename={(name) => rename(renaming.file, name)}
      />
    ),
    open: (file) => setRenaming({ file, open: true }),
  };
}
