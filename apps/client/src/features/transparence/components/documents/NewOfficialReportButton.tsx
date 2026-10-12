import Button from '@codegouvfr/react-dsfr/Button';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath } from 'react-router';

import { Tooltip } from '@/shared/ui/tooltip';
import { ROUTE_PATHS } from '@/utils/route-path.utils';

import type { AgendaDocument } from './session-document-groups';

type Readiness = NonNullable<AgendaDocument['officialReportReadiness']>;

function MissingForOfficialReport(props: { readiness: Exclude<Readiness, { status: 'READY' }> }) {
  const { formatList, formatMessage } = useIntl();
  const { readiness } = props;

  if (readiness.status === 'NEVER_PUBLISHED') {
    return (
      <FormattedMessage defaultMessage="Vous devez publier la transparence aux membres dans l'onglet Propositions" />
    );
  }

  const missing = [
    readiness.filesWithoutOutcome > 0 &&
      formatMessage(
        {
          defaultMessage: `renseigner l'issue de {count, plural,
            one {1 proposition}
            other {{count, number} propositions}}`,
        },
        { count: readiness.filesWithoutOutcome },
      ),
    readiness.filesWithoutReporter > 0 &&
      formatMessage(
        {
          defaultMessage: `affecter un rapporteur à {count, plural,
            one {1 proposition}
            other {{count, number} propositions}}`,
        },
        { count: readiness.filesWithoutReporter },
      ),
    readiness.filesWithUnpublishedReporter > 0 &&
      formatMessage({ defaultMessage: 'publier la transparence aux membres' }),
  ].filter((label) => typeof label === 'string');

  if (missing.length === 0) {
    return (
      <FormattedMessage defaultMessage="Chaque proposition de l'ordre du jour doit avoir une issue et un rapporteur publié" />
    );
  }

  return (
    <FormattedMessage
      defaultMessage="Pour générer le procès-verbal, il reste à {missing}"
      values={{ missing: formatList(missing, { type: 'conjunction' }) }}
    />
  );
}

export function NewOfficialReportButton(props: { agenda: AgendaDocument; sessionId: string }) {
  const readiness = props.agenda.officialReportReadiness;
  if (!readiness) return null;

  if (readiness.status === 'READY') {
    return (
      <Button
        iconId="fr-icon-add-line"
        iconPosition="right"
        linkProps={{
          state: { agendaId: props.agenda.id },
          to: generatePath(ROUTE_PATHS.SG.OFFICIAL_REPORT_NEW, { sessionId: props.sessionId }),
        }}
        priority="secondary"
        size="small"
      >
        <FormattedMessage defaultMessage="Générer un procès-verbal" />
      </Button>
    );
  }

  return (
    <Tooltip focusable label={<MissingForOfficialReport readiness={readiness} />}>
      <Button disabled iconId="fr-icon-add-line" iconPosition="right" priority="secondary" size="small">
        <FormattedMessage defaultMessage="Générer un procès-verbal" />
      </Button>
    </Tooltip>
  );
}
