import clsx from 'clsx';
import type { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

export function MissingEvaluationBanner(props: {
  children?: ReactNode;
  className?: string;
  missingEvaluation: boolean;
}) {
  if (!props.missingEvaluation) return null;

  return (
    <div
      className={clsx(
        'flex items-center gap-2 bg-(--background-contrast-warning) text-sm-plus font-medium text-(--text-default-warning)',
        props.className,
      )}
    >
      <span aria-hidden className="fr-icon-draft-line shrink-0 before:[--icon-size:1.25rem]" />
      <span>
        <FormattedMessage defaultMessage="Évaluation manquante dans le dossier administratif LOLFI" />
      </span>
      {props.children}
    </div>
  );
}
