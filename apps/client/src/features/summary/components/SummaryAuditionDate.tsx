import Button from '@codegouvfr/react-dsfr/Button';
import Input from '@codegouvfr/react-dsfr/Input';
import { format } from 'date-fns';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useUpdateNominationFileAuditionDateMutation } from '@queries/members.queries';

function toInputValues(iso: string | null | undefined): { date: string; time: string } {
  if (!iso) return { date: '', time: '' };
  const parsed = new Date(iso);
  return { date: format(parsed, 'yyyy-MM-dd'), time: format(parsed, 'HH:mm') };
}

function toIsoString(date: string, time: string): string | null {
  if (!date || !time) return null;
  const parsed = new Date(`${date}T${time}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function SummaryAuditionDate(props: {
  editable: boolean;
  initialAuditionDate: string | null;
  nominationFileId: string;
  sessionId: string;
}) {
  const { editable, initialAuditionDate, nominationFileId, sessionId } = props;
  const { formatMessage } = useIntl();
  const { mutateAsync } = useUpdateNominationFileAuditionDateMutation();

  const [{ date, time }, setValues] = useState(toInputValues(initialAuditionDate));
  const [savedIso, setSavedIso] = useState(() => toIsoString(date, time));
  const [missing, setMissing] = useState<'date' | 'time' | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);

  const save = async (nextDate: string, nextTime: string) => {
    const auditionDate = toIsoString(nextDate, nextTime);
    if (auditionDate === savedIso) return;
    try {
      await mutateAsync({ auditionDate, nominationFileId, sessionId });
      setSavedIso(auditionDate);
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

  return (
    <div>
      {editable ? (
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
      ) : (
        <p className="fr-mb-0">
          {date ? (
            format(new Date(`${date}T${time || '00:00'}`), "dd/MM/yyyy 'à' HH'h'mm")
          ) : (
            <span className="text-(--text-mention-grey)">
              <FormattedMessage defaultMessage="Aucune date et heure d'audition" />
            </span>
          )}
        </p>
      )}
    </div>
  );
}
