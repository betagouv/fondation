import clsx from 'clsx';
import { useIntl } from 'react-intl';

export function MissingEvaluationIcon(props: { className?: string; missingEvaluation: boolean }) {
  const { formatMessage } = useIntl();

  if (!props.missingEvaluation) return null;

  const label = formatMessage({
    defaultMessage: 'Évaluation manquante dans le dossier administratif LOLFI',
  });

  return (
    <i
      aria-label={label}
      className={clsx('fr-icon-draft-line fr-icon--sm', props.className)}
      role="img"
      title={label}
    />
  );
}
