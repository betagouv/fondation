import Button from '@codegouvfr/react-dsfr/Button';
import Input from '@codegouvfr/react-dsfr/Input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { useIsSg } from '@/features/auth/hooks/roles.hook';
import { useSummary } from '@/features/summary/context/SummaryContext';
import type { PlainDateOnly } from '@/utils/date-only.util';
import type { PlainTimeOnly } from '@/utils/time-only.util';
import { useUpdateNominationFileAuditionDateMutation } from '@queries/members.queries';

import { SummarySectionCard } from './SummarySectionCard';

type AuditionDate = PlainDateOnly | null;
type AuditionTime = PlainTimeOnly | null;

export function SummarySectionAuditionDate() {
  const { summary, sessionId, nominationFileId } = useSummary();
  const isSg = useIsSg();
  const editable = isSg && summary.canScheduleAudition;

  if (!editable && !summary.auditionDate) return null;

  return (
    <SummarySectionCard id="audition">
      <h2>
        <FormattedMessage defaultMessage="Audition" />
      </h2>
      <AuditionDateForm
        editable={editable}
        initialAuditionDate={summary.auditionDate}
        initialAuditionTime={summary.auditionTime}
        nominationFileId={nominationFileId}
        sessionId={sessionId}
      />
    </SummarySectionCard>
  );
}

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

export function AuditionDateForm(props: {
  editable: boolean;
  initialAuditionDate: AuditionDate;
  initialAuditionTime: AuditionTime;
  nominationFileId: string;
  sessionId: string;
}) {
  const { editable, initialAuditionDate, initialAuditionTime, nominationFileId, sessionId } = props;
  const { formatMessage, formatDate, formatTime } = useIntl();
  const { mutateAsync } = useUpdateNominationFileAuditionDateMutation();

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
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { date: initialDate, time: initialTime },
  });

  const savedKey = useRef(`${initialDate}|${initialTime}`);
  const [saveFailed, setSaveFailed] = useState(false);

  const save = handleSubmit(async ({ date, time }) => {
    const key = `${date}|${time}`;
    if (key === savedKey.current) return;

    try {
      await mutateAsync({
        auditionDate: inputToDate(date),
        auditionTime: inputToTime(time),
        nominationFileId,
        sessionId,
      });
      savedKey.current = key;
      setSaveFailed(false);
    } catch {
      setSaveFailed(true);
    }
  });

  const reset = () => {
    setValue('date', '');
    setValue('time', '');
    void save();
  };

  if (!editable) {
    const scheduledAt = initialDate && initialTime ? new Date(`${initialDate}T${initialTime}`) : null;
    return (
      <p className="fr-mb-0">
        {scheduledAt ? (
          <FormattedMessage
            defaultMessage="{date} à {time}"
            values={{
              date: formatDate(scheduledAt, { format: 'dateOnlyShort' }),
              time: formatTime(scheduledAt, { format: 'timeOnlyShort' }),
            }}
          />
        ) : (
          <span className="text-(--text-mention-grey)">
            <FormattedMessage defaultMessage="Aucune date et heure d'audition" />
          </span>
        )}
      </p>
    );
  }

  const date = watch('date');
  const time = watch('time');
  const validationError = errors.date?.message ?? errors.time?.message;

  return (
    <div>
      <div className="flex flex-row items-end gap-2">
        <Controller
          control={control}
          name="date"
          render={({ field }) => (
            <Input
              className="fr-mb-0"
              label={formatMessage({ defaultMessage: 'Date' })}
              nativeInputProps={{
                onBlur: () => void save(),
                onChange: field.onChange,
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
              label={formatMessage({ defaultMessage: 'Heure' })}
              nativeInputProps={{
                onBlur: () => void save(),
                onChange: field.onChange,
                type: 'time',
                value: field.value,
              }}
            />
          )}
        />
        {(date || time) && (
          <Button
            iconId="fr-icon-close-line"
            onClick={reset}
            priority="tertiary no outline"
            title={formatMessage({ defaultMessage: "Réinitialiser la date d'audition" })}
          >
            <FormattedMessage defaultMessage="Réinitialiser" />
          </Button>
        )}
      </div>
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
