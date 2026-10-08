import Button from '@codegouvfr/react-dsfr/Button';
import Input from '@codegouvfr/react-dsfr/Input';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { type ReactNode, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { useUnsavedGuard } from '../../hooks/use-unsaved-guard/use-unsaved-guard.hook';
import { useConfirmModal } from '@/shared/context/confirm-modal';
import { dateOnlyFromIso, dateOnlyToIso, type PlainDateOnly } from '@/utils/date-only.util';
import {
  isPastSchedule,
  formTimeOnlyCodec,
  timeOnlyToString,
  toScheduledDate,
  type PlainTimeOnly,
} from '@/utils/time-only.util';
import { useUpdateNominationFileAuditionDateMutation } from '@queries/members.queries';
import { useScheduleObservantAuditionMutation } from '@queries/observations.queries';

export const AUDITION_DATE_INPUT_ID = 'magistrat-audition-date-input';

type AuditionDate = PlainDateOnly | null;
type AuditionTime = PlainTimeOnly | null;

export type AuditionTarget =
  | { nominationFileId: string; type: 'NOMINATION_FILE' }
  | { nominationFileId: string; observationId: string; type: 'OBSERVANT' };

function useAuditionMutation(target: AuditionTarget, sessionId: string) {
  const nominationFileAudition = useUpdateNominationFileAuditionDateMutation();
  const observantAudition = useScheduleObservantAuditionMutation();
  const mutation = target.type === 'OBSERVANT' ? observantAudition : nominationFileAudition;

  const mutate = (
    audition: { auditionDate: AuditionDate; auditionTime: AuditionTime },
    options: { onSuccess: () => void },
  ) =>
    target.type === 'OBSERVANT'
      ? observantAudition.mutate(
          {
            ...audition,
            nominationFileId: target.nominationFileId,
            observationId: target.observationId,
            sessionId,
          },
          options,
        )
      : nominationFileAudition.mutate(
          { ...audition, nominationFileId: target.nominationFileId, sessionId },
          options,
        );

  return {
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    mutate,
    reset: mutation.reset,
    savedDate: mutation.variables?.auditionDate,
  };
}

export function AuditionDateForm(props: {
  children?: ReactNode;
  editable: boolean;
  headingLevel?: 'h2' | 'h3';
  initialAuditionDate: AuditionDate;
  initialAuditionTime: AuditionTime;
  // an observant is heard once for all their observations: changing the date changes it on every one
  isShared?: boolean;
  sessionId: string;
  target: AuditionTarget;
}) {
  const { editable, initialAuditionDate, initialAuditionTime } = props;
  const { formatMessage, formatDate, formatTime } = useIntl();
  const {
    isError: saveFailed,
    isSuccess: saveSucceeded,
    mutate,
    reset: resetSaveState,
    savedDate,
  } = useAuditionMutation(props.target, props.sessionId);

  const initialDate = initialAuditionDate ? dateOnlyToIso(initialAuditionDate) : '';
  const initialTime = initialAuditionTime ? (timeOnlyToString(initialAuditionTime, 'HH:mm') ?? '') : '';

  const schema = useMemo(
    () =>
      z.object({ date: z.string(), time: z.string() }).superRefine((value, ctx) => {
        if (!value.date === !value.time) return;

        if (!value.date) {
          ctx.issues.push({
            code: 'custom',
            input: value.date,
            message: formatMessage({ defaultMessage: 'La date est à renseigner' }),
            path: ['date'],
          });
        } else {
          ctx.issues.push({
            code: 'custom',
            input: value.time,
            message: formatMessage({ defaultMessage: "L'heure est à renseigner" }),
            path: ['time'],
          });
        }
      }),
    [formatMessage],
  );

  const {
    control,
    handleSubmit,
    reset: resetForm,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: { date: initialDate, time: initialTime },
    resolver: zodResolver(schema),
  });

  const date = useWatch({ control, name: 'date' });
  const time = useWatch({ control, name: 'time' });

  const isIncomplete = editable && !!date !== !!time;
  const showIncompleteWarning = useUnsavedGuard('audition-date', isIncomplete);

  const [editingPastAudition, setEditingPastAudition] = useState(false);
  const { waitForConfirmation } = useConfirmModal();

  const isConfirmed = async () => {
    if (!props.isShared) return true;

    const { isConfirmed } = await waitForConfirmation({
      content: (
        <p>
          <FormattedMessage defaultMessage="L'observant a fait plusieurs observations, cette modification se répercutera sur l'ensemble des observations correspondantes. Confirmez-vous votre action de modification ?" />
        </p>
      ),
      i18n: {
        cancel: formatMessage({ defaultMessage: 'Annuler' }),
        confirm: formatMessage({ defaultMessage: 'Confirmer' }),
      },
      title: formatMessage({ defaultMessage: "Modifier l'audition" }),
    });
    if (!isConfirmed) resetForm({ date: initialDate, time: initialTime });
    return isConfirmed;
  };

  const save = handleSubmit(async ({ date, time }) => {
    if (!isDirty || !(await isConfirmed())) return;
    mutate(
      {
        auditionDate: date ? dateOnlyFromIso(date) : null,
        auditionTime: time ? formTimeOnlyCodec.decode(time) : null,
      },
      { onSuccess: () => resetForm({ date, time }) },
    );
  });

  const clear = async () => {
    if (!(await isConfirmed())) return;
    mutate(
      { auditionDate: null, auditionTime: null },
      { onSuccess: () => resetForm({ date: '', time: '' }) },
    );
  };

  const scheduledAt = toScheduledDate(initialAuditionDate, initialAuditionTime);
  const isPast = isPastSchedule(initialAuditionDate, initialAuditionTime);

  const editPastAudition = async () => {
    if (!scheduledAt) return;

    const { isConfirmed } = await waitForConfirmation({
      content: (
        <p>
          <FormattedMessage
            defaultMessage="Cette audition a eu lieu le {date} à {time}. Voulez-vous vraiment la modifier ?"
            values={{
              date: formatDate(scheduledAt, { format: 'zonedDateShort' }),
              time: formatTime(scheduledAt, { format: 'zonedTimeShort' }),
            }}
          />
        </p>
      ),
      i18n: {
        cancel: formatMessage({ defaultMessage: 'Annuler' }),
        confirm: formatMessage({ defaultMessage: 'Modifier la date' }),
      },
      title: formatMessage({ defaultMessage: 'Modifier une audition passée' }),
    });
    if (isConfirmed) setEditingPastAudition(true);
  };

  if (!editable) {
    return (
      <div>
        <AuditionHeading className="fr-mb-4v" level={props.headingLevel} />
        <p className="fr-mb-0">
          {scheduledAt ? (
            isPast ? (
              <FormattedMessage
                defaultMessage="Une audition a eu lieu le {date} à {time}"
                values={{
                  date: formatDate(scheduledAt, { format: 'zonedDateShort' }),
                  time: formatTime(scheduledAt, { format: 'zonedTimeShort' }),
                }}
              />
            ) : (
              <FormattedMessage
                defaultMessage="Une audition est prévue le {date} à {time}"
                values={{
                  date: formatDate(scheduledAt, { format: 'zonedDateShort' }),
                  time: formatTime(scheduledAt, { format: 'zonedTimeShort' }),
                }}
              />
            )
          ) : (
            <span className="text-(--text-mention-grey)">
              <FormattedMessage defaultMessage="Aucune date et heure d'audition" />
            </span>
          )}
        </p>
      </div>
    );
  }

  const isLocked = isPast && !editingPastAudition;

  const missingFieldMessage = !date
    ? formatMessage({ defaultMessage: 'La date est à renseigner' })
    : formatMessage({ defaultMessage: "L'heure est à renseigner" });
  const validationError =
    errors.date?.message ?? errors.time?.message ?? (showIncompleteWarning ? missingFieldMessage : undefined);

  return (
    <div>
      <div className="fr-mb-4v flex items-center justify-between gap-2">
        <AuditionHeading className="fr-mb-0" level={props.headingLevel} />
        {isLocked ? (
          <Button className="btn-compact" onClick={editPastAudition} priority="secondary" size="small">
            <FormattedMessage defaultMessage="Modifier la date passée" />
          </Button>
        ) : (
          (date || time) && (
            <Button
              className="btn-compact"
              onClick={() => void clear()}
              priority="secondary"
              size="small"
              title={formatMessage({ defaultMessage: "Réinitialiser la date et l'heure d'audition" })}
            >
              <FormattedMessage defaultMessage="Réinitialiser" />
            </Button>
          )
        )}
      </div>
      {props.children}
      <div className="flex flex-row items-end gap-2">
        <Controller
          control={control}
          name="date"
          render={({ field }) => (
            <Input
              className="fr-mb-0"
              disabled={isLocked}
              label={formatMessage({ defaultMessage: 'Date' })}
              nativeInputProps={{
                id: AUDITION_DATE_INPUT_ID,
                onBlur: () => void save(),
                onChange: (event) => {
                  field.onChange(event);
                  resetSaveState();
                },
                type: 'date',
                value: field.value,
              }}
            />
          )}
        />
        <Controller
          control={control}
          name="time"
          render={({ field }) => (
            <Input
              className="fr-mb-0"
              disabled={isLocked}
              label={formatMessage({ defaultMessage: 'Heure' })}
              nativeInputProps={{
                onBlur: () => void save(),
                onChange: (event) => {
                  field.onChange(event);
                  resetSaveState();
                },
                type: 'time',
                value: field.value,
              }}
            />
          )}
        />
      </div>
      {saveSucceeded && !validationError && (
        <p className="fr-valid-text fr-mt-2v" role="status">
          {savedDate
            ? formatMessage({ defaultMessage: "Date d'audition enregistrée" })
            : formatMessage({ defaultMessage: "Date d'audition réinitialisée" })}
        </p>
      )}
      {validationError && (
        <p className="fr-error-text fr-mt-2v" role="alert">
          {validationError}
        </p>
      )}
      {saveFailed && (
        <p className="fr-error-text fr-mt-2v" role="alert">
          {formatMessage({ defaultMessage: "L'enregistrement de la date d'audition a échoué" })}
        </p>
      )}
    </div>
  );
}

function AuditionHeading(props: { className: string; level: 'h2' | 'h3' | undefined }) {
  const title = <FormattedMessage defaultMessage="Audition" />;

  return props.level === 'h2' ? (
    <h2 className={clsx('fr-h4', props.className)}>{title}</h2>
  ) : (
    <h3 className={clsx('text-xl font-semibold', props.className)}>{title}</h3>
  );
}
