import Button from '@codegouvfr/react-dsfr/Button';
import Input from '@codegouvfr/react-dsfr/Input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { useUnsavedGuard } from '../../hooks/use-unsaved-guard/use-unsaved-guard.hook';
import { useConfirmation } from '@/shared/context/confirmation';
import type { PlainDateOnly } from '@/utils/date-only.util';
import { isPastSchedule, toScheduledDate, type PlainTimeOnly } from '@/utils/time-only.util';
import { useUpdateNominationFileAuditionDateMutation } from '@queries/members.queries';

export const AUDITION_DATE_INPUT_ID = 'magistrat-audition-date-input';

type AuditionDate = PlainDateOnly | null;
type AuditionTime = PlainTimeOnly | null;

function dateToInput(date: AuditionDate): string {
  if (!date) return '';
  return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
}

function timeToInput(time: AuditionTime): string {
  if (!time) return '';
  return `${String(time.hours).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')}`;
}

function inputToDate(value: string): AuditionDate {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  return { year, month, day };
}

function inputToTime(value: string): AuditionTime {
  if (!value) return null;
  const [hours, minutes] = value.split(':').map(Number);
  return { hours, minutes, seconds: 0 };
}

export function MagistratAuditionDateForm(props: {
  editable: boolean;
  initialAuditionDate: AuditionDate;
  initialAuditionTime: AuditionTime;
  nominationFileId: string;
  sessionId: string;
}) {
  const { editable, initialAuditionDate, initialAuditionTime, nominationFileId, sessionId } = props;
  const { formatMessage, formatDate, formatTime } = useIntl();
  const {
    mutate,
    isError: saveFailed,
    isSuccess: saveSucceeded,
    variables: savedValues,
    reset: resetSaveState,
  } = useUpdateNominationFileAuditionDateMutation();

  const initialDate = dateToInput(initialAuditionDate);
  const initialTime = timeToInput(initialAuditionTime);

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
    resolver: zodResolver(schema),
    defaultValues: { date: initialDate, time: initialTime },
  });

  const date = useWatch({ control, name: 'date' });
  const time = useWatch({ control, name: 'time' });

  const isIncomplete = editable && !!date !== !!time;
  const showIncompleteWarning = useUnsavedGuard('audition-date', isIncomplete);

  const [editingPastAudition, setEditingPastAudition] = useState(false);
  const { buttonProps, waitForConfirmation } = useConfirmation();

  const save = handleSubmit(({ date, time }) => {
    if (!isDirty) return;
    mutate(
      { auditionDate: inputToDate(date), auditionTime: inputToTime(time), nominationFileId, sessionId },
      { onSuccess: () => resetForm({ date, time }) },
    );
  });

  const clear = () => {
    mutate(
      { auditionDate: null, auditionTime: null, nominationFileId, sessionId },
      { onSuccess: () => resetForm({ date: '', time: '' }) },
    );
  };

  const scheduledAt = toScheduledDate(initialAuditionDate, initialAuditionTime);
  const isPast = isPastSchedule(initialAuditionDate, initialAuditionTime);

  const editPastAudition = async () => {
    if (!scheduledAt) return;

    const { isConfirmed } = await waitForConfirmation({
      title: formatMessage({ defaultMessage: 'Modifier une audition passée' }),
      content: (
        <p>
          <FormattedMessage
            defaultMessage="Cette audition a eu lieu le {date} à {time}. Voulez-vous vraiment la modifier ?"
            values={{
              date: formatDate(scheduledAt, { format: 'dateOnlyShort' }),
              time: formatTime(scheduledAt, { format: 'timeOnlyShort' }),
            }}
          />
        </p>
      ),
      i18n: {
        cancel: formatMessage({ defaultMessage: 'Annuler' }),
        confirm: formatMessage({ defaultMessage: 'Modifier la date' }),
      },
    });
    if (isConfirmed) setEditingPastAudition(true);
  };

  if (!editable) {
    return (
      <div>
        <h3 className="fr-mb-4v text-xl font-semibold">
          <FormattedMessage defaultMessage="Audition" />
        </h3>
        <p className="fr-mb-0">
          {scheduledAt ? (
            isPast ? (
              <FormattedMessage
                defaultMessage="Une audition a eu lieu le {date} à {time}"
                values={{
                  date: formatDate(scheduledAt, { format: 'dateOnlyShort' }),
                  time: formatTime(scheduledAt, { format: 'timeOnlyShort' }),
                }}
              />
            ) : (
              <FormattedMessage
                defaultMessage="Une audition est prévue le {date} à {time}"
                values={{
                  date: formatDate(scheduledAt, { format: 'dateOnlyShort' }),
                  time: formatTime(scheduledAt, { format: 'timeOnlyShort' }),
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
        <h3 className="fr-mb-0 text-xl font-semibold">
          <FormattedMessage defaultMessage="Audition" />
        </h3>
        {isLocked ? (
          <Button
            className="btn-compact"
            nativeButtonProps={buttonProps}
            onClick={editPastAudition}
            priority="secondary"
            size="small"
          >
            <FormattedMessage defaultMessage="Modifier la date passée" />
          </Button>
        ) : (
          (date || time) && (
            <Button
              className="btn-compact"
              onClick={clear}
              priority="secondary"
              size="small"
              title={formatMessage({ defaultMessage: "Réinitialiser la date et l'heure d'audition" })}
            >
              <FormattedMessage defaultMessage="Réinitialiser" />
            </Button>
          )
        )}
      </div>
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
          {savedValues?.auditionDate
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
