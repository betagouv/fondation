import Button from '@codegouvfr/react-dsfr/Button';
import Input from '@codegouvfr/react-dsfr/Input';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { DetailedSummaryDto } from '@api/types';
import { useUpdateNominationFileAuditionDateMutation } from '@queries/members.queries';

type AuditionDate = DetailedSummaryDto['auditionDate'];
type AuditionTime = DetailedSummaryDto['auditionTime'];

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

export function SummaryAuditionDate(props: {
  editable: boolean;
  initialAuditionDate: AuditionDate;
  initialAuditionTime: AuditionTime;
  nominationFileId: string;
  sessionId: string;
}) {
  const { editable, initialAuditionDate, initialAuditionTime, nominationFileId, sessionId } = props;
  const { formatMessage, formatDate, formatTime } = useIntl();
  const { mutateAsync } = useUpdateNominationFileAuditionDateMutation();

  const [{ date, time }, setValues] = useState({
    date: dateToInput(initialAuditionDate),
    time: timeToInput(initialAuditionTime),
  });
  const [savedKey, setSavedKey] = useState(`${date}|${time}`);
  const [missing, setMissing] = useState<'date' | 'time' | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);

  const save = async (nextDate: string, nextTime: string) => {
    if (`${nextDate}|${nextTime}` === savedKey) return;
    try {
      await mutateAsync({
        auditionDate: inputToDate(nextDate),
        auditionTime: inputToTime(nextTime),
        nominationFileId,
        sessionId,
      });
      setSavedKey(`${nextDate}|${nextTime}`);
      setSaveFailed(false);
    } catch {
      setSaveFailed(true);
    }
  };

  const commit = (nextDate: string, nextTime: string) => {
    if (!nextDate === !nextTime) {
      setMissing(null);
      void save(nextDate, nextTime);
    } else {
      setMissing(!nextDate ? 'date' : 'time');
    }
  };

  const reset = () => {
    setValues({ date: '', time: '' });
    setMissing(null);
    void save('', '');
  };

  if (!editable) {
    const scheduledAt = date && time ? new Date(`${date}T${time}`) : null;
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

  return (
    <div>
      <div className="flex flex-row items-end gap-2">
        <Input
          className="fr-mb-0"
          label={formatMessage({ defaultMessage: 'Date' })}
          nativeInputProps={{
            onBlur: (event) => commit(event.target.value, time),
            onChange: (event) => setValues((prev) => ({ ...prev, date: event.target.value })),
            type: 'date',
            value: date,
          }}
        />
        <Input
          className="fr-mb-0"
          label={formatMessage({ defaultMessage: 'Heure' })}
          nativeInputProps={{
            onBlur: (event) => commit(date, event.target.value),
            onChange: (event) => setValues((prev) => ({ ...prev, time: event.target.value })),
            type: 'time',
            value: time,
          }}
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
      {missing && (
        <p className="fr-error-text fr-mt-2v" role="alert">
          {missing === 'date'
            ? formatMessage({ defaultMessage: 'La date est à renseigner' })
            : formatMessage({ defaultMessage: "L'heure est à renseigner" })}
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
