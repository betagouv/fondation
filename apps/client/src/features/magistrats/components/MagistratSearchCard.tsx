import Badge from '@codegouvfr/react-dsfr/Badge';
import { useId } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router';

import type { FoundMagistrat } from '@queries/magistrats.queries';

export function MagistratSearchCard(props: { detailsPath: string; magistrat: FoundMagistrat }) {
  const { currentPosition, gradeAndJurisdiction, name, status, usedName } = props.magistrat;
  const positionLabel = currentPosition?.function?.label ?? currentPosition?.jurisdiction.label;
  const titleId = useId();

  return (
    <article
      aria-labelledby={titleId}
      className="flex flex-col gap-2 border border-(--border-default-grey) p-6"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="fr-text--lg fr-mb-0" id={titleId}>
          <Link
            className="fr-link fr-text--lg fr-icon-account-circle-fill fr-link--icon-left"
            to={props.detailsPath}
          >
            {name}
          </Link>
        </h2>
        {status === 'ACTIVE' ? (
          <Badge noIcon severity="success" small>
            <FormattedMessage defaultMessage="Actif" />
          </Badge>
        ) : (
          <Badge noIcon small>
            <FormattedMessage defaultMessage="Inactif" />
          </Badge>
        )}
      </div>
      {usedName && (
        <p className="fr-mb-0">
          <FormattedMessage defaultMessage="Nom d'usage : {usedName}" values={{ usedName }} />
        </p>
      )}
      {positionLabel && <p className="fr-mb-0">{positionLabel}</p>}
      {gradeAndJurisdiction && <p className="fr-mb-0 text-(--text-mention-grey)">{gradeAndJurisdiction}</p>}
    </article>
  );
}
