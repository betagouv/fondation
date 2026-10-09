import ToggleSwitch from '@codegouvfr/react-dsfr/ToggleSwitch';
import { FormattedMessage, useIntl } from 'react-intl';

import { useConfirmModal } from '@/shared/context/confirm-modal';
import { Tooltip } from '@/shared/ui/tooltip';
import { toScheduledDate } from '@/utils/time-only.util';
import { useUpdateNominationFileAuditionRequestMutation } from '@queries/members.queries';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

export function AuditionRequestToggle(props: { nominationFile: SessionNominationFile; sessionId: string }) {
  const { nominationFile, sessionId } = props;
  const { formatDate, formatMessage, formatTime } = useIntl();
  const { isError: saveFailed, isPending: saving, mutate } = useUpdateNominationFileAuditionRequestMutation();

  const { waitForConfirmation } = useConfirmModal();
  const label = formatMessage({ defaultMessage: 'Prévoir une audition' });
  const scheduledAt = toScheduledDate(nominationFile.auditionDate, nominationFile.auditionTime);
  const imposed = nominationFile.auditionRequirement === 'POSITION';

  const reason = imposed
    ? formatMessage({ defaultMessage: 'Une audition est à prévoir pour ce poste' })
    : nominationFile.auditionRequired
      ? formatMessage({ defaultMessage: 'Magistrat à convoquer en audition' })
      : null;

  // dismissing a scheduled audition removes its date, which deserves a second thought
  const onChange = async (requested: boolean) => {
    if (!requested && scheduledAt) {
      const { isConfirmed } = await waitForConfirmation({
        content: (
          <p>
            <FormattedMessage
              defaultMessage="La date d'audition du {date} à {time} sera effacée. Confirmez-vous ?"
              values={{
                date: formatDate(scheduledAt, { format: 'zonedDateShort' }),
                time: formatTime(scheduledAt, { format: 'zonedTimeShort' }),
              }}
            />
          </p>
        ),
        i18n: {
          cancel: formatMessage({ defaultMessage: 'Annuler' }),
          confirm: formatMessage({ defaultMessage: "Retirer l'audition" }),
        },
        title: formatMessage({ defaultMessage: "Retirer l'audition" }),
      });
      if (!isConfirmed) return;
    }

    mutate({ nominationFileId: nominationFile.id, requested, sessionId });
  };

  const toggle = (
    <ToggleSwitch
      checked={nominationFile.auditionRequired}
      className="w-auto shrink-0"
      classes={{
        input: 'inset-0! h-full! w-full!',
        label:
          'w-auto! text-sm! leading-6! whitespace-nowrap text-(--text-action-high-blue-france) before:ml-2!',
      }}
      disabled={imposed || saving}
      label={
        <>
          <span className="fr-sr-only">{label}</span>
          <span aria-hidden className="w-8 text-right">
            {nominationFile.auditionRequired ? (
              <FormattedMessage defaultMessage="Oui" />
            ) : (
              <FormattedMessage defaultMessage="Non" />
            )}
          </span>
        </>
      }
      labelPosition="left"
      onChange={(checked) => void onChange(checked)}
      showCheckedHint={false}
    />
  );

  return (
    <div className="fr-mb-4v">
      <div className="flex items-center justify-between gap-4">
        <span aria-hidden>{label}</span>
        {reason ? (
          // a locked toggle takes no focus: the tooltip takes it instead
          <Tooltip focusable={imposed} label={reason}>
            {toggle}
          </Tooltip>
        ) : (
          toggle
        )}
      </div>
      {saveFailed && (
        <p className="fr-error-text fr-mt-1v" role="alert">
          <FormattedMessage defaultMessage="L'enregistrement a échoué" />
        </p>
      )}
    </div>
  );
}
