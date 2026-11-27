import { FormattedMessage } from 'react-intl';

import { Tooltip } from '@/shared/ui/tooltip';

export function GuidelinesAdaptationBadge() {
  return (
    <Tooltip
      focusable
      isVisualOnly
      label={
        <FormattedMessage defaultMessage="Lignes directrices de gestion adaptées sur la durée d'affectation du poste actuel" />
      }
    >
      <span className="rounded-full bg-(--background-action-high-blue-france) px-1.5 text-[0.625rem] leading-4 font-bold text-(--text-inverted-blue-france)">
        <span aria-hidden>LDG</span>
        <span className="fr-sr-only">
          <FormattedMessage defaultMessage="Lignes directrices de gestion adaptées sur la durée d'affectation du poste actuel" />
        </span>
      </span>
    </Tooltip>
  );
}
