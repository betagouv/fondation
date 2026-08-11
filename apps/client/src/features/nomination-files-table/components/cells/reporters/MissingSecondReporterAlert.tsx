import { colors } from '@codegouvfr/react-dsfr';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import Tooltip from '@codegouvfr/react-dsfr/Tooltip';
import clsx from 'clsx';
import { useIntl } from 'react-intl';

import { useIsSgNavigation } from '@/features/auth/hooks/roles.hook';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

/** @see https://www.notion.so/2-Proposer-automatiquement-deux-rapporteurs-sur-certains-postes-26aa2ff25f1581848cc0eef5a4d77252 */
function requires2Reporters(dossier: SessionNominationFile, selectedCount?: number) {
  const hasOneReporter = selectedCount !== undefined ? selectedCount == 1 : dossier.reporters.length === 1;
  return hasOneReporter && dossier.auditionExpected;
}

export function MissingSecondReporterAlert(props: {
  dossier: SessionNominationFile;
  selectedReportersCount?: number;
}) {
  const { formatMessage } = useIntl();
  const isSg = useIsSgNavigation();
  if (!isSg || !requires2Reporters(props.dossier, props.selectedReportersCount)) return null;

  const label = formatMessage({ defaultMessage: '2 rapporteurs attendus' });

  return (
    <div className="fr-pr-1v cursor-help">
      <Tooltip title={label}>
        <i
          aria-label={label}
          role="img"
          style={{
            color: colors.decisions.text.default.warning.default,
            backgroundColor: colors.decisions.background.contrast.warning.default,
          }}
          className={clsx(
            cx('fr-icon-warning-fill'),
            'text-center',
            'block',
            'rounded-full',
            'fr-p-1v',
            'size-6',
            'before:block',
            'before:content-[""]',
            'before:size-4!',
          )}
        />
      </Tooltip>
    </div>
  );
}
