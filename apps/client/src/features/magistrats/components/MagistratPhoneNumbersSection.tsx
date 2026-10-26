import Button from '@codegouvfr/react-dsfr/Button';
import clsx from 'clsx';
import { useId, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { IconButton } from '@/shared/ui/icon-button';
import { Tooltip } from '@/shared/ui/tooltip';
import { formatDateOnly } from '@/utils/date-only.util';
import { formatPhoneNumber } from '@/utils/string.utils';
import { ValidationError } from '@/utils/validation-error';
import { useUser } from '@queries/auth.queries';
import {
  type MagistratPhoneNumber,
  useAddMagistratPhoneNumberMutation,
  useDeleteMagistratPhoneNumberMutation,
  useMagistratPhoneNumbersQuery,
  useUpdateMagistratPhoneNumberMutation,
} from '@queries/magistrats.queries';

import { MagistratPhoneNumberDeleteModal } from './MagistratPhoneNumberDeleteModal';
import { MagistratPhoneNumberModal } from './MagistratPhoneNumberModal';

type SavedPhoneNumber = Extract<MagistratPhoneNumber, { source: 'FONDATION' }>;

// the edited number outlives the closing, for the modal to fade out with its content
type Editing = { open: boolean } & (
  | { action: 'ADD' }
  | { action: 'DELETE'; phoneNumber: SavedPhoneNumber }
  | { action: 'UPDATE'; phoneNumber: SavedPhoneNumber }
);

export function MagistratPhoneNumbersSection(props: { magistratId: string; magistratName: string }) {
  const { formatMessage } = useIntl();
  const { data: phoneNumbers, isError, isLoading } = useMagistratPhoneNumbersQuery(props);
  const addPhoneNumber = useAddMagistratPhoneNumberMutation(props);
  const updatePhoneNumber = useUpdateMagistratPhoneNumberMutation(props);
  const deletePhoneNumber = useDeleteMagistratPhoneNumberMutation(props);
  const [editing, setEditing] = useState<Editing | null>(null);
  const titleId = useId();

  if (isLoading) {
    return (
      <p className="fr-mb-0">
        <FormattedMessage defaultMessage="Chargement..." />
      </p>
    );
  }

  if (isError) {
    return (
      <p className="fr-error-text fr-mt-0" role="alert">
        <FormattedMessage defaultMessage="Les numéros n'ont pas pu être chargés" />
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
  const numberError = (error: Error | null) => (error instanceof ValidationError ? error.message : null);
  const hasFailed = (error: Error | null) => !!error && !(error instanceof ValidationError);
  const [firstPhoneNumber, ...otherPhoneNumbers] = phoneNumbers ?? [];
  const isOnTitleLine =
    otherPhoneNumbers.length === 0 && !(firstPhoneNumber?.source === 'FONDATION' && firstPhoneNumber.label);

  return (
    <>
      <div className={clsx(isOnTitleLine && 'flex items-center gap-1')}>
        <h3
          className={clsx(
            'flex min-h-8 items-center text-base font-bold text-(--text-default-grey)',
            isOnTitleLine ? 'fr-m-0' : 'fr-mb-1v',
          )}
          id={titleId}
        >
          <FormattedMessage
            defaultMessage="{count, plural, one {Téléphone} other {Numéros de téléphone}}"
            values={{ count: phoneNumbers?.length ?? 0 }}
          />
        </h3>
        {phoneNumbers?.length ? (
          <ul aria-labelledby={titleId} className="m-0 flex min-w-0 grow list-none flex-col p-0">
            {phoneNumbers.map((phoneNumber) => (
              <MagistratPhoneNumberItem
                key={phoneNumber.source === 'FONDATION' ? phoneNumber.id : phoneNumber.number}
                onDelete={(phoneNumber) => setEditing({ action: 'DELETE', open: true, phoneNumber })}
                onUpdate={(phoneNumber) => setEditing({ action: 'UPDATE', open: true, phoneNumber })}
                phoneNumber={phoneNumber}
              />
            ))}
          </ul>
        ) : (
          <p className="fr-mb-0">-</p>
        )}
      </div>

      <Button
        className="fr-mt-2v"
        onClick={() => setEditing({ action: 'ADD', open: true })}
        priority="tertiary"
        size="small"
      >
        <FormattedMessage defaultMessage="Ajouter un numéro" />
      </Button>

      {editing?.action === 'ADD' ? (
        <MagistratPhoneNumberModal
          hasFailed={hasFailed(addPhoneNumber.error)}
          isSaving={addPhoneNumber.isPending}
          onClose={close}
          numberError={numberError(addPhoneNumber.error)}
          onClosed={closed}
          onSave={(phoneNumber) => addPhoneNumber.mutate(phoneNumber, { onSuccess: close })}
          open={editing.open}
          title={formatMessage({ defaultMessage: 'Ajouter un numéro de téléphone' })}
        />
      ) : null}

      {editing?.action === 'UPDATE' ? (
        <MagistratPhoneNumberModal
          hasFailed={hasFailed(updatePhoneNumber.error)}
          initialPhoneNumber={editing.phoneNumber}
          isSaving={updatePhoneNumber.isPending}
          key={editing.phoneNumber.id}
          numberError={numberError(updatePhoneNumber.error)}
          onClose={close}
          onClosed={closed}
          onSave={(phoneNumber) =>
            updatePhoneNumber.mutate(
              { ...phoneNumber, phoneNumberId: editing.phoneNumber.id },
              { onSuccess: close },
            )
          }
          open={editing.open}
          title={formatMessage({ defaultMessage: 'Modifier le numéro' })}
        />
      ) : null}

      {editing?.action === 'DELETE' ? (
        <MagistratPhoneNumberDeleteModal
          hasFailed={deletePhoneNumber.isError}
          isDeleting={deletePhoneNumber.isPending}
          magistratName={props.magistratName}
          onClose={close}
          onClosed={closed}
          onDelete={() => deletePhoneNumber.mutate(editing.phoneNumber.id, { onSuccess: close })}
          open={editing.open}
          phoneNumber={editing.phoneNumber}
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
  const { user } = useUser();
  const { phoneNumber } = props;
  const number = formatPhoneNumber(phoneNumber.number);
  const date = phoneNumber.date ? formatDateOnly(phoneNumber.date) : null;
  const origin =
    phoneNumber.source === 'FONDATION'
      ? formatMessage(
          {
            defaultMessage:
              'Saisi dans Fondation le {date}{who, select, self { par vous} someone { par {name}} other {}}',
          },
          {
            date,
            name: phoneNumber.savedBy?.name,
            who: !phoneNumber.savedBy ? 'nobody' : phoneNumber.savedBy.id === user?.id ? 'self' : 'someone',
          },
        )
      : date
        ? formatMessage(
            {
              defaultMessage: 'Saisi par le magistrat dans une candidature LOLFI mise à jour le {date}',
            },
            { date },
          )
        : formatMessage({ defaultMessage: 'Saisi par le magistrat dans une candidature LOLFI' });
  const label = phoneNumber.source === 'FONDATION' ? phoneNumber.label : null;

  return (
    <li className="flex min-h-8 items-center gap-3 p-0">
      <Tooltip className="shrink-0 whitespace-nowrap" focusable label={origin}>
        {number}
      </Tooltip>
      {label ? (
        <span className="min-w-0 text-xs wrap-break-word text-(--text-mention-grey)">{label}</span>
      ) : null}
      {phoneNumber.source === 'FONDATION' ? (
        <span className="ml-auto flex shrink-0 items-center">
          <IconButton
            iconId="fr-icon-edit-line"
            label={formatMessage({ defaultMessage: 'Modifier le numéro {number}' }, { number })}
            onClick={() => props.onUpdate(phoneNumber)}
            small
          />
          <IconButton
            iconId="fr-icon-delete-line"
            label={formatMessage({ defaultMessage: 'Supprimer le numéro {number}' }, { number })}
            onClick={() => props.onDelete(phoneNumber)}
            small
          />
        </span>
      ) : null}
    </li>
  );
}
