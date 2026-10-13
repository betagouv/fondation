import Badge from '@codegouvfr/react-dsfr/Badge';
import Button from '@codegouvfr/react-dsfr/Button';
import { useId } from 'react';
import { FormattedMessage } from 'react-intl';

import { gradeAndPositionLabel } from '@/utils/position.utils';
import { getMagistratDetailsPath } from '@/utils/route-path.utils';
import type { FoundMagistrat } from '@queries/magistrats.queries';

export function MagistratSearchCard(props: { context: 'sg' | 'membre'; magistrat: FoundMagistrat }) {
  const { currentPosition, grade, id, name, status, usedName } = props.magistrat;
  const positionLabel = currentPosition?.function?.label ?? currentPosition?.jurisdiction.label;
  const titleId = useId();

  return (
    <article
      aria-labelledby={titleId}
      className="flex flex-col gap-2 border border-(--border-default-grey) p-6"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2
          className="fr-text--lg fr-mb-0 fr-icon-account-circle-fill fr-icon--sm flex items-center gap-2"
          id={titleId}
        >
          {name}
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="fr-mb-0 text-(--text-mention-grey)">
          {gradeAndPositionLabel(grade, currentPosition?.jurisdiction.id ?? null)}
        </p>
        <Button
          iconId="fr-icon-arrow-right-line"
          iconPosition="right"
          linkProps={{ to: getMagistratDetailsPath({ context: props.context, magistratId: id }) }}
          priority="tertiary no outline"
        >
          <FormattedMessage
            defaultMessage="Ouvrir la fiche <sr-only>de {name}</sr-only>"
            values={{ name, 'sr-only': (chunks) => <span className="fr-sr-only">{chunks}</span> }}
          />
        </Button>
      </div>
    </article>
  );
}
