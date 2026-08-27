import ToggleSwitch from '@codegouvfr/react-dsfr/ToggleSwitch';
import { FormattedMessage, useIntl } from 'react-intl';

import { AlertBanner } from '@/shared/ui/alert-banner';
import { useUpdateNominationFileMissingEvaluationMutation } from '@queries/members.queries';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

const BANNER_LAYOUT = '-mx-8 px-8 py-4';

export function MissingEvaluation(props: {
  editable: boolean;
  nominationFile: SessionNominationFile;
  sessionId: string;
}) {
  const { editable, nominationFile, sessionId } = props;
  const { missingEvaluation } = nominationFile;
  const { formatMessage } = useIntl();
  const { mutate, isError: saveFailed } = useUpdateNominationFileMissingEvaluationMutation();

  const updatable = editable && nominationFile.content.isUpdatable;
  if (!missingEvaluation && !updatable) return null;

  const label = formatMessage({
    defaultMessage: 'Évaluation manquante dans le dossier administratif LOLFI',
  });

  return (
    <AlertBanner
      align="center"
      className={BANNER_LAYOUT}
      icon="fr-icon-draft-line"
      message={
        <>
          {label}
          {saveFailed && (
            <span className="fr-error-text fr-mb-0 block" role="alert">
              <FormattedMessage defaultMessage="L'enregistrement a échoué" />
            </span>
          )}
        </>
      }
      tone={missingEvaluation ? 'warning' : 'neutral'}
    >
      {editable && (
        <ToggleSwitch
          checked={missingEvaluation}
          className="ml-auto w-auto shrink-0"
          classes={{
            input: 'inset-0! h-full! w-full!',
            label:
              'w-auto! text-sm! leading-6! whitespace-nowrap text-(--text-action-high-blue-france) before:ml-2!',
          }}
          disabled={!nominationFile.content.isUpdatable}
          label={
            <>
              <span className="fr-sr-only">{label}</span>
              <span aria-hidden className="w-8 text-right">
                {missingEvaluation ? (
                  <FormattedMessage defaultMessage="Oui" />
                ) : (
                  <FormattedMessage defaultMessage="Non" />
                )}
              </span>
            </>
          }
          labelPosition="left"
          onChange={(checked) =>
            mutate({ missingEvaluation: checked, nominationFileId: nominationFile.id, sessionId })
          }
          showCheckedHint={false}
        />
      )}
    </AlertBanner>
  );
}
