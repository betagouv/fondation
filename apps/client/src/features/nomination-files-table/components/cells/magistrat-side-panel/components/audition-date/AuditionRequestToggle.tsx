import ToggleSwitch from '@codegouvfr/react-dsfr/ToggleSwitch';
import { FormattedMessage, useIntl } from 'react-intl';

import { useUpdateNominationFileAuditionRequestMutation } from '@queries/members.queries';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

export function AuditionRequestToggle(props: { nominationFile: SessionNominationFile; sessionId: string }) {
  const { nominationFile, sessionId } = props;
  const { formatMessage } = useIntl();
  const { isError: saveFailed, isPending: saving, mutate } = useUpdateNominationFileAuditionRequestMutation();

  const scheduled = !!nominationFile.auditionDate;
  const label = formatMessage({ defaultMessage: 'Audition à prévoir' });

  return (
    <div className="fr-mb-4v">
      <div className="flex items-center justify-between gap-4">
        <span aria-hidden>{label}</span>
        <ToggleSwitch
          checked={nominationFile.auditionRequired}
          className="w-auto shrink-0"
          classes={{
            input: 'inset-0! h-full! w-full!',
            label:
              'w-auto! text-sm! leading-6! whitespace-nowrap text-(--text-action-high-blue-france) before:ml-2!',
          }}
          disabled={scheduled || saving}
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
          onChange={(checked) =>
            mutate({ nominationFileId: nominationFile.id, requested: checked, sessionId })
          }
          showCheckedHint={false}
        />
      </div>
      {scheduled && (
        <p className="fr-text--sm fr-mb-0 text-(--text-mention-grey)">
          <FormattedMessage defaultMessage="Réinitialisez la date pour retirer l'audition" />
        </p>
      )}
      {saveFailed && (
        <p className="fr-error-text fr-mt-1v" role="alert">
          <FormattedMessage defaultMessage="L'enregistrement a échoué" />
        </p>
      )}
    </div>
  );
}
