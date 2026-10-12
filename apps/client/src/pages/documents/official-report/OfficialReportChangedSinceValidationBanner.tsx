import { defineMessages, FormattedMessage } from 'react-intl';

import type { SystemUpdateCause } from '@/features/documents/hooks/useSystemUpdateCauses';
import { AlertBanner } from '@/shared/ui/alert-banner';

const CHANGES_SINCE_VALIDATION = defineMessages<SystemUpdateCause>({
  AGENDA_DATE: {
    defaultMessage: "La date de l'ordre du jour a changé. Si celle du PV est erronée, éditez-le.",
  },
  AGENDA_PROPOSITIONS: {
    defaultMessage: "Des propositions ont été ajoutées ou retirées de l'ordre du jour.",
  },
  AGENDA_TEXT: {
    defaultMessage: "Le texte d'une proposition a été modifié dans l'ordre du jour.",
  },
  OUTCOME: {
    defaultMessage:
      "L'issue d'une proposition a changé. Le PV garde celle décidée en séance : la nouvelle sera restituée par la séance qui l'a décidée.",
  },
  REPORTERS: {
    defaultMessage: "Les rapporteurs d'une proposition ont changé. Le PV garde ceux de la séance.",
  },
  SESSION_DATE: {
    defaultMessage: 'La date de la session a changé. Si celle du PV est erronée, éditez-le.',
  },
});

export function OfficialReportChangedSinceValidationBanner(props: { changes: readonly SystemUpdateCause[] }) {
  if (props.changes.length === 0) return null;

  return (
    <AlertBanner
      className="flex-col px-4 py-3"
      message={
        <span className="font-medium">
          <FormattedMessage defaultMessage="Depuis sa dernière validation, ce PV n'a pas suivi ces changements :" />
        </span>
      }
      tone="info"
    >
      <ul className="fr-text--sm fr-mb-0">
        {props.changes.map((change) => (
          <li key={change}>
            <FormattedMessage {...CHANGES_SINCE_VALIDATION[change]} />
          </li>
        ))}
      </ul>
    </AlertBanner>
  );
}
