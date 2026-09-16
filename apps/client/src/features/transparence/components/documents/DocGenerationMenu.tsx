import { useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath } from 'react-router';

import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from '@/shared/ui/menu';
import { formatDateOnly } from '@/utils/date-only.util';
import { getNewAgendaPath, ROUTE_PATHS } from '@/utils/route-path.utils';
import type { DocGenerationSessionReadinessDto } from '@api/types';
import { useIsSessionReadyForDocGenerationQuery } from '@queries/agenda.queries';

function AgendaBlockerHint(props: { blocker: DocGenerationSessionReadinessDto['agendaBlocker'] }) {
  if (props.blocker === 'ARCHIVED') {
    return <FormattedMessage defaultMessage="Cette transparence est archivée" />;
  }

  if (props.blocker === 'NO_AFFECTATION') {
    return (
      <FormattedMessage defaultMessage="Vous devez affecter des rapporteurs dans l'onglet Propositions" />
    );
  }

  if (props.blocker === 'UNPUBLISHED_AFFECTATION') {
    return (
      <FormattedMessage defaultMessage="Vous devez publier la transparence aux membres dans l'onglet Propositions" />
    );
  }

  return (
    <FormattedMessage defaultMessage="Toutes les propositions ont déjà été actées dans un procès-verbal" />
  );
}

function OfficialReportBlockerHint(props: {
  blocker: DocGenerationSessionReadinessDto['officialReportBlocker'];
}) {
  const { blocker } = props;

  const { formatList, formatMessage } = useIntl();

  if (blocker?.reason === 'NO_AGENDA') {
    return <FormattedMessage defaultMessage="Vous devez d'abord générer un ordre du jour" />;
  }

  if (blocker?.reason === 'ALL_AGENDAS_REPORTED') {
    return <FormattedMessage defaultMessage="Tous les ordres du jour ont déjà un procès-verbal" />;
  }

  if (blocker?.reason === 'NEVER_PUBLISHED') {
    return (
      <FormattedMessage defaultMessage="Vous devez publier la transparence aux membres dans l'onglet Propositions" />
    );
  }

  const agendas = blocker?.agendas ?? [];
  const toPublish = agendas.filter(
    ({ filesWithoutOutcome, filesWithoutReporter }) =>
      filesWithoutOutcome === 0 && filesWithoutReporter === 0,
  );
  const toComplete = agendas.filter(
    ({ filesWithoutOutcome, filesWithoutReporter }) => filesWithoutOutcome > 0 || filesWithoutReporter > 0,
  );

  if (agendas.length === 0) {
    return (
      <FormattedMessage defaultMessage="Chaque proposition de l'ordre du jour doit avoir une issue et un rapporteur publié" />
    );
  }

  const sentences = [
    toPublish.length > 0 &&
      formatMessage(
        {
          defaultMessage: `Pour {count, plural,
            one {l'ordre du jour}
            other {les ordres du jour}} {dates}, vous devez publier la transparence aux membres.`,
        },
        { count: toPublish.length, dates: formatMeetingDates(toPublish) },
      ),

    ...toComplete.map((agenda) =>
      formatMessage(
        {
          defaultMessage: `Pour l'ordre du jour {dates}, vous devez {missing}.`,
        },
        { dates: formatMeetingDates([agenda]), missing: formatMissing(agenda) },
      ),
    ),
  ].filter((sentence) => typeof sentence === 'string');

  function formatMeetingDates(list: typeof agendas): string {
    return formatList(
      list.map(({ meetingDate }) =>
        formatMessage({ defaultMessage: 'du {date}' }, { date: formatDateOnly(meetingDate) }),
      ),
      { type: 'conjunction' },
    );
  }

  function formatMissing(agenda: (typeof agendas)[number]): string {
    return formatList(
      [
        agenda.filesWithoutOutcome > 0 &&
          formatMessage(
            {
              defaultMessage: `renseigner l'issue de {count, plural,
                one {1 proposition}
                other {{count, number} propositions}}`,
            },
            { count: agenda.filesWithoutOutcome },
          ),
        agenda.filesWithoutReporter > 0 &&
          formatMessage(
            {
              defaultMessage: `affecter un rapporteur à {count, plural,
                one {1 proposition}
                other {{count, number} propositions}}`,
            },
            { count: agenda.filesWithoutReporter },
          ),
        agenda.filesWithUnpublishedReporter > 0 &&
          formatMessage({ defaultMessage: 'publier la transparence aux membres' }),
      ].filter((label) => typeof label === 'string'),
      { type: 'conjunction' },
    );
  }

  return (
    <span className="flex flex-col items-start gap-1">
      {sentences.map((sentence, index) => (
        <span key={index}>{sentence}</span>
      ))}
      <FormattedMessage defaultMessage="Ces actions se font dans l'onglet Propositions." tagName="span" />
    </span>
  );
}

export function DocGenerationMenu(props: { sessionId: string }) {
  const { data: readiness } = useIsSessionReadyForDocGenerationQuery({
    sessionId: props.sessionId,
  });

  const officialReportPath = useMemo(
    () =>
      generatePath(ROUTE_PATHS.SG.OFFICIAL_REPORT_NEW, {
        sessionId: props.sessionId,
      }),
    [props.sessionId],
  );

  const canCreateAgenda = !!readiness?.canCreateAgenda;
  const canCreateOfficialReport = !!readiness?.canCreateOfficialReport;

  return (
    <MenuRoot>
      <MenuTrigger className="py-2!" iconId="fr-icon-folder-2-line" priority="primary" size="small">
        <FormattedMessage defaultMessage="Générer la documentation" />
        <i aria-hidden className="fr-icon-arrow-down-s-line fr-icon--sm fr-ml-1v" />
      </MenuTrigger>

      <MenuContent>
        {canCreateAgenda ? (
          <MenuItem iconId="ri-calendar-line" linkProps={{ to: getNewAgendaPath(props.sessionId) }}>
            <FormattedMessage defaultMessage="Ordre du jour" />
          </MenuItem>
        ) : (
          <MenuItem disabled iconId="ri-calendar-line">
            <span className="flex flex-col items-start text-left">
              <FormattedMessage defaultMessage="Ordre du jour" />
              <span className="text-xs font-normal text-(--text-mention-grey)">
                <AgendaBlockerHint blocker={readiness?.agendaBlocker ?? null} />
              </span>
            </span>
          </MenuItem>
        )}

        {canCreateOfficialReport ? (
          <MenuItem iconId="ri-file-text-line" linkProps={{ to: officialReportPath }}>
            <FormattedMessage defaultMessage="Procès-verbal" />
          </MenuItem>
        ) : (
          <MenuItem disabled iconId="ri-file-text-line">
            <span className="flex flex-col items-start text-left">
              <FormattedMessage defaultMessage="Procès-verbal" />
              <span className="text-xs font-normal text-(--text-mention-grey)">
                <OfficialReportBlockerHint blocker={readiness?.officialReportBlocker ?? null} />
              </span>
            </span>
          </MenuItem>
        )}
      </MenuContent>
    </MenuRoot>
  );
}
