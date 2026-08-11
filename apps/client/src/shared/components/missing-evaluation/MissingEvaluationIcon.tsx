import Tooltip from '@codegouvfr/react-dsfr/Tooltip';
import clsx from 'clsx';
import { useIntl } from 'react-intl';

export function MissingEvaluationIcon(props: { className?: string; missingEvaluation: boolean }) {
  const { formatMessage } = useIntl();

  if (!props.missingEvaluation) return null;

  const label = formatMessage({
    defaultMessage: 'Évaluation manquante dans le dossier administratif LOLFI',
  });

  return (
    <Tooltip kind="hover" title={label}>
      <i
        aria-label={label}
        className={clsx(
          'fr-icon-draft-line fr-icon--sm text-(--text-action-high-blue-france)',
          props.className,
        )}
        role="img"
      />
    </Tooltip>
  );
}
