import { differenceInYears, format } from 'date-fns';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import { useSummary } from '@/features/summary/context/SummaryContext';
import { FormattedPositionDuration } from '@/i18n/components';
import { AuditionBanner } from '@/shared/components/audition-banner';
import { LolfiMagistratLink } from '@/shared/components/LolfiMagistratLink';
import { PriorityBadgeList } from '@/shared/components/priority-badge';
import { dateOnlyToDate } from '@/utils/date-only.util';

import { SummarySectionCard } from './SummarySectionCard';

export function SummarySectionMagistrat() {
  const { summary, sessionId, nominationFileId } = useSummary();

  return (
    <SummarySectionCard id="magistrat">
      <header className="fr-mb-6v">
        {summary.priorities.length > 0 && (
          <div className="fr-mb-3v">
            <PriorityBadgeList priorities={summary.priorities} small={false} />
          </div>
        )}
        <h1 className="fr-mb-0 flex flex-row items-center">
          <span>{summary.name}</span>
          <LolfiMagistratLink sessionId={sessionId} nominationFileId={nominationFileId} name={summary.name} />
        </h1>
      </header>

      <AuditionBanner
        date={summary.auditionDate}
        time={summary.auditionTime}
        className="fr-mb-6v rounded px-4 py-3"
      />

      <List>
        <List.Item isVisible={!!summary.birthDate}>
          <List.ItemTitle>
            <FormattedMessage defaultMessage="Date de naissance" />
          </List.ItemTitle>
          <List.ItemContent>
            <BirthDate date={summary.birthDate} />
          </List.ItemContent>
        </List.Item>

        <List.Item isVisible={!!summary.position}>
          <List.ItemTitle>
            <FormattedMessage defaultMessage="Poste actuel" />
          </List.ItemTitle>
          <List.ItemContent>{summary.position}</List.ItemContent>
        </List.Item>

        <List.Item isVisible={!!summary.lastPositionDate}>
          <List.ItemTitle>
            <FormattedMessage defaultMessage="Durée sur le poste" />
          </List.ItemTitle>
          <List.ItemContent>
            <FormattedPositionDuration value={summary.lastPositionDate} />
          </List.ItemContent>
        </List.Item>

        <List.Item isVisible={!!summary.rank}>
          <List.ItemTitle>
            <FormattedMessage defaultMessage="Rang" />
          </List.ItemTitle>
          <List.ItemContent>{summary.rank}</List.ItemContent>
        </List.Item>

        <List.Item isVisible={!!summary.targetedPosition}>
          <List.ItemTitle>
            <FormattedMessage defaultMessage="Poste pressenti" />
          </List.ItemTitle>
          <List.ItemContent>{summary.targetedPosition}</List.ItemContent>
        </List.Item>
      </List>
    </SummarySectionCard>
  );
}

function BirthDate(props: { date: { day: number; month: number; year: number } | null }) {
  if (!props.date) return null;

  const now = new Date();
  const date = dateOnlyToDate(props.date);
  const str = format(date, 'dd/MM/yyyy');

  const age = differenceInYears(now, date);

  return (
    <FormattedMessage
      defaultMessage="{date} ({age, plural, one {# an} other {# ans}})"
      values={{ age, date: str }}
    />
  );
}

function List(props: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-2">{props.children}</div>;
}

List.ItemContent = (props: { children: React.ReactNode }) => <span>{props.children}</span>;
List.ItemTitle = (props: { children: React.ReactNode }) => (
  <span className="font-bold">{props.children}&nbsp;:&nbsp;</span>
);
List.Item = function Item(props: { className?: string; isVisible?: boolean; children: React.ReactNode }) {
  if (props.isVisible === false) return null;

  return <div className={`flex flex-row ${props.className ?? ''}`}>{props.children}</div>;
};
