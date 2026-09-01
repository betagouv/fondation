import Alert from '@codegouvfr/react-dsfr/Alert';
import Button from '@codegouvfr/react-dsfr/Button';
import Input from '@codegouvfr/react-dsfr/Input';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { Modal } from '@/shared/ui/modal';
import { RequiredLabel } from '@/shared/ui/required-label';
import { useToasts } from '@/shared/ui/toast';
import { dateOnlyToIso } from '@/utils/date-only.util';
import type { DetailedNominationSessionDto } from '@api/types';
import { useUser } from '@queries/auth.queries';
import {
  useUpdateNominationSessionMutation,
  useValidateSessionMutation,
} from '@queries/nomination-sessions.queries';

const FORM_ID = 'edit-transparence-form';

export function TableauDeBordEditTransparenceModal(props: {
  onClose: () => void;
  onClosed: () => void;
  open: boolean;
  session: DetailedNominationSessionDto;
}) {
  const { formatMessage } = useIntl();
  const toasts = useToasts();

  const { user } = useUser();

  const { session } = props;
  const { mutate: updateNominationSession, isPending: isUpdating } = useUpdateNominationSessionMutation();
  const { mutate: validateSession, isPending: isValidating } = useValidateSessionMutation();

  const isSaving = isUpdating || isValidating;

  const invalidDate = formatMessage({ defaultMessage: 'Format de date invalide' });
  const clearableDate = z.iso.date(invalidDate).nullable().or(z.literal(''));

  const {
    control,
    formState: { errors, isDirty },
    handleSubmit,
    setError,
  } = useForm({
    resolver: zodResolver(
      z.object({
        name: z.string().nonempty(),
        date: z.iso.date(invalidDate),
        observationsClosingDate: z.iso.date(invalidDate),
        dueDate: clearableDate,
        positionStartDate: clearableDate,
      }),
    ),
    defaultValues: {
      name: session.name,
      date: session.date ? dateOnlyToIso(session.date) : '',
      observationsClosingDate: session.observationsClosingDate
        ? dateOnlyToIso(session.observationsClosingDate)
        : '',
      dueDate: session.dueDate ? dateOnlyToIso(session.dueDate) : null,
      positionStartDate: session.positionStartDate ? dateOnlyToIso(session.positionStartDate) : null,
    },
  });

  const onSubmit = (data: {
    name: string;
    date: string;
    observationsClosingDate: string;
    dueDate: string | null;
    positionStartDate: string | null;
  }) => {
    updateNominationSession(
      {
        sessionId: session.id,
        data: {
          ...data,
          dueDate: data.dueDate || null,
          positionStartDate: data.positionStartDate || null,
        },
      },
      {
        onSuccess: () => {
          toasts.success({
            title: formatMessage({ defaultMessage: 'Transparence "{name}" modifiée' }, { name: data.name }),
          });

          if (session.isValidated || !user) return props.onClose();

          validateSession({ sessionId: session.id, userId: user.id }, { onSettled: () => props.onClose() });
        },
        onError: () => {
          setError(`root`, {
            message: formatMessage({ defaultMessage: 'Erreur lors de la modification de la transparence' }),
          });
        },
      },
    );
  };

  return (
    <Modal
      actions={
        <>
          <Button disabled={isSaving} onClick={props.onClose} priority="secondary">
            <FormattedMessage defaultMessage="Annuler" />
          </Button>
          <Button disabled={isSaving || !isDirty} nativeButtonProps={{ form: FORM_ID, type: 'submit' }}>
            <FormattedMessage defaultMessage="Enregistrer" />
          </Button>
        </>
      }
      id="edit-transparence"
      onClose={props.onClose}
      onClosed={props.onClosed}
      open={props.open}
      title={<FormattedMessage defaultMessage='Éditer "{name}"' values={{ name: session.name }} />}
    >
      <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)}>
        {errors.root && (
          <Alert className="fr-mb-2v" description="" severity="error" small title={errors.root.message} />
        )}

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value, ...field } }) => (
            <Input
              className="w-full"
              id="nom-transparence"
              label={
                <RequiredLabel>
                  <FormattedMessage defaultMessage="Nom de la transparence" />
                </RequiredLabel>
              }
              nativeInputProps={{
                autoFocus: true,
                onChange,
                value,
                ...field,
                placeholder: formatMessage({ defaultMessage: 'Nom de la transparence' }),
              }}
              state={errors.name ? 'error' : 'default'}
              stateRelatedMessage={errors.name?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="date"
          render={({ field: { onChange, value, ...field } }) => (
            <Input
              className="w-full"
              id="date-transparence"
              label={
                <RequiredLabel>
                  <FormattedMessage defaultMessage="Date de la transparence" />
                </RequiredLabel>
              }
              nativeInputProps={{
                onChange,
                type: 'date',
                value,
                ...field,
              }}
              state={errors.date ? 'error' : 'default'}
              stateRelatedMessage={errors.date?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="observationsClosingDate"
          render={({ field: { onChange, value, ...field } }) => (
            <Input
              className="w-full"
              id="date-cloture-delai-observation"
              label={
                <RequiredLabel>
                  <FormattedMessage defaultMessage="Clôture du délai d'observation" />
                </RequiredLabel>
              }
              nativeInputProps={{
                onChange,
                type: 'date',
                value,
                ...field,
              }}
              state={errors.observationsClosingDate ? 'error' : 'default'}
              stateRelatedMessage={errors.observationsClosingDate?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="dueDate"
          render={({ field: { onChange, value, ...field } }) => (
            <Input
              className="w-full"
              id="date-echeance"
              label={<FormattedMessage defaultMessage="Date d'échéance" />}
              nativeInputProps={{
                onChange,
                type: 'date',
                value: value ?? undefined,
                ...field,
              }}
              state={errors.dueDate ? 'error' : 'default'}
              stateRelatedMessage={errors.dueDate?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="positionStartDate"
          render={({ field: { onChange, value, ...field } }) => (
            <Input
              className="w-full"
              id="date-prise-de-poste"
              label={<FormattedMessage defaultMessage="Date de prise de poste" />}
              nativeInputProps={{
                onChange,
                type: 'date',
                value: value ?? undefined,
                ...field,
              }}
              state={errors.positionStartDate ? 'error' : 'default'}
              stateRelatedMessage={errors.positionStartDate?.message}
            />
          )}
        />
      </form>
    </Modal>
  );
}
