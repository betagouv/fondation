import { defineMessages, useIntl } from 'react-intl';

import type { FoundSessionDocsDto } from '@api/types';

export type SystemUpdateCause = NonNullable<
  FoundSessionDocsDto['items'][number]['draftUpdate']
>['causes'][number];

// each reads after "suite", so that several of them join into one sentence
const SYSTEM_UPDATE_CAUSES = defineMessages<SystemUpdateCause>({
  AGENDA_DATE: { defaultMessage: "au changement de date de l'ordre du jour" },
  AGENDA_PROPOSITIONS: { defaultMessage: "à l'ajout ou au retrait de propositions dans l'ordre du jour" },
  AGENDA_TEXT: { defaultMessage: "à la modification du texte d'une proposition dans l'ordre du jour" },
  OUTCOME: { defaultMessage: "au changement d'issue d'une proposition" },
  REPORTERS: { defaultMessage: 'au changement de rapporteurs' },
  SESSION_DATE: { defaultMessage: 'au changement de date de la session' },
});

export function useSystemUpdateCauses() {
  const { formatList, formatMessage } = useIntl();

  return (causes: readonly SystemUpdateCause[]) =>
    formatList(
      causes.map((cause) => formatMessage(SYSTEM_UPDATE_CAUSES[cause])),
      { type: 'conjunction' },
    );
}
