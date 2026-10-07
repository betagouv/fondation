import Button from '@codegouvfr/react-dsfr/Button';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { Tooltip } from '@/shared/ui/tooltip';
import { formatDateOnly } from '@/utils/date-only.util';
import { formatPhoneNumber } from '@/utils/string.utils';
import {
  type MagistratPhoneNumber,
  useAddMagistratPhoneNumberMutation,
  useDeleteMagistratPhoneNumberMutation,
  useMagistratPhoneNumbersQuery,
  useUpdateMagistratPhoneNumberMutation,
  ValidationError,
} from '@queries/magistrats.queries';

import { MagistratInfoItem, MagistratInfoList } from './MagistratIdentityCard';
import { MagistratPhoneNumberDeleteModal } from './MagistratPhoneNumberDeleteModal';
import { MagistratPhoneNumberModal } from './MagistratPhoneNumberModal';

type SavedPhoneNumber = Extract<MagistratPhoneNumber, { source: 'FONDATION' }>;

// the edited number outlives the closing, for the modal to fade out with its content
type Editing = { open: boolean } & (
  | { action: 'ADD' }
  | { action: 'DELETE'; phoneNumber: SavedPhoneNumber }
  | { action: 'UPDATE'; phoneNumber: SavedPhoneNumber }
);

export function MagistratPhoneNumbersSection(props: { magistratId: string }) {
  const { formatMessage } = useIntl();
  const { data: phoneNumbers, isLoading } = useMagistratPhoneNumbersQuery(props);
  const addPhoneNumber = useAddMagistratPhoneNumberMutation(props);
  const updatePhoneNumber = useUpdateMagistratPhoneNumberMutation(props);
  const deletePhoneNumber = useDeleteMagistratPhoneNumberMutation(props);
  const [editing, setEditing] = useState<Editing | null>(null);

  if (isLoading) {
    return (
      <p className="fr-mb-0">
        <FormattedMessage defaultMessage="Chargement..." />
      </p>
    );
  }

  const close = () => {
    setEditing((current) => current && { ...current, open: false });
    addPhoneNumber.reset();
    updatePhoneNumber.reset();
    deletePhoneNumber.reset();
  };
  const closed = () => setEditing(null);
  const failure = (error: Error | null) =>
    error
      ? error instanceof ValidationError
        ? error.message
        : formatMessage({ defaultMessage: "L'enregistrement a échoué" })
      : null;

  return (
    <>
      <MagistratInfoList>
        {phoneNumbers?.length ? (
          phoneNumbers.map((phoneNumber) => (
            <MagistratPhoneNumberItem
              key={phoneNumber.source === 'FONDATION' ? phoneNumber.id : phoneNumber.number}
              onDelete={(phoneNumber) => setEditing({ action: 'DELETE', open: true, phoneNumber })}
              onUpdate={(phoneNumber) => setEditing({ action: 'UPDATE', open: true, phoneNumber })}
              phoneNumber={phoneNumber}
            />
          ))
        ) : (
          <MagistratInfoItem label={<FormattedMessage defaultMessage="Tél" />}>
            <FormattedMessage defaultMessage="Aucun numéro connu" />
          </MagistratInfoItem>
        )}
      </MagistratInfoList>

      <Button
        className="fr-mt-4v"
        onClick={() => setEditing({ action: 'ADD', open: true })}
        priority="tertiary"
        size="small"
      >
        <FormattedMessage defaultMessage="Ajouter un n° de téléphone" />
      </Button>

      {editing?.action === 'ADD' ? (
        <MagistratPhoneNumberModal
          error={failure(addPhoneNumber.error)}
          isSaving={addPhoneNumber.isPending}
          onClose={close}
          onClosed={closed}
          onSave={(phoneNumber) => addPhoneNumber.mutate(phoneNumber, { onSuccess: close })}
          open={editing.open}
          title={formatMessage({ defaultMessage: 'Ajouter un numéro' })}
        />
      ) : null}

      {editing?.action === 'UPDATE' ? (
        <MagistratPhoneNumberModal
          error={failure(updatePhoneNumber.error)}
          initialPhoneNumber={editing.phoneNumber}
          isSaving={updatePhoneNumber.isPending}
          key={editing.phoneNumber.id}
          onClose={close}
          onClosed={closed}
          onSave={(phoneNumber) =>
            updatePhoneNumber.mutate(
              { ...phoneNumber, phoneNumberId: editing.phoneNumber.id },
              { onSuccess: close },
            )
          }
          open={editing.open}
          title={formatMessage({ defaultMessage: 'Modifier un numéro' })}
        />
      ) : null}

      {editing?.action === 'DELETE' ? (
        <MagistratPhoneNumberDeleteModal
          hasFailed={deletePhoneNumber.isError}
          isDeleting={deletePhoneNumber.isPending}
          number={editing.phoneNumber.number}
          onClose={close}
          onClosed={closed}
          onDelete={() => deletePhoneNumber.mutate(editing.phoneNumber.id, { onSuccess: close })}
          open={editing.open}
        />
      ) : null}
    </>
  );
}

function MagistratPhoneNumberItem(props: {
  onDelete: (phoneNumber: SavedPhoneNumber) => void;
  onUpdate: (phoneNumber: SavedPhoneNumber) => void;
  phoneNumber: MagistratPhoneNumber;
}) {
  const { formatMessage } = useIntl();
  const { phoneNumber } = props;
  const number = formatPhoneNumber(phoneNumber.number);
  const date = phoneNumber.date ? formatDateOnly(phoneNumber.date) : null;
  const origin =
    phoneNumber.source === 'FONDATION'
      ? formatMessage({ defaultMessage: 'Saisi dans Fondation le {date}' }, { date })
      : date
        ? formatMessage({ defaultMessage: 'Issu de LOLFI, candidature du {date}' }, { date })
        : formatMessage({ defaultMessage: 'Issu de LOLFI' });
  const label = phoneNumber.source === 'FONDATION' ? phoneNumber.label : null;

  return (
    // a LOLFI number has no action to reach its tooltip with the keyboard
    <Tooltip focusable={phoneNumber.source === 'LOLFI'} label={origin}>
      <MagistratInfoItem
        label={
          label ? (
            <FormattedMessage defaultMessage="Tél {label}" values={{ label }} />
          ) : (
            <FormattedMessage defaultMessage="Tél" />
          )
        }
      >
        {number}
        {phoneNumber.source === 'FONDATION' ? (
          <>
            <Button
              className="fr-ml-1v"
              iconId="fr-icon-edit-line"
              onClick={() => props.onUpdate(phoneNumber)}
              priority="tertiary no outline"
              size="small"
              title={formatMessage({ defaultMessage: 'Modifier le numéro {number}' }, { number })}
            />
            <Button
              iconId="fr-icon-delete-line"
              onClick={() => props.onDelete(phoneNumber)}
              priority="tertiary no outline"
              size="small"
              title={formatMessage({ defaultMessage: 'Supprimer le numéro {number}' }, { number })}
            />
          </>
        ) : null}
      </MagistratInfoItem>
    </Tooltip>
  );
}
