import { differenceInYears, format } from 'date-fns';
import React from 'react';

import { LolfiMagistratLink } from '@/components/shared/LolfiMagistratLink';
import { PriorityBadgeList } from '@/components/shared/priorities/PriorityBadge';
import { FormattedPositionDuration } from '@/i18n/components';
import { useSummary } from '@/pages/summary/SummaryContext';
import { dateOnlyToDate } from '@/utils/date-only.util';

import { SummarySectionCard } from './SummarySectionCard';

export function SummarySectionMagistrat() {
  const { summary, sessionId, nominationFileId } = useSummary();

  return (
    <SummarySectionCard id="magistrat">
      <header className="fr-mb-6v">
        <h1 className="fr-mb-0 flex flex-row items-center">
          <span>{summary.name}</span>
          <LolfiMagistratLink sessionId={sessionId} nominationFileId={nominationFileId} name={summary.name} />
        </h1>
        <PriorityBadgeList priorities={summary.priorities} small={false} />
      </header>

      <List>
        <List.Item isVisible={!!summary.birthDate}>
          <List.ItemTitle>Date de naissance</List.ItemTitle>
          <List.ItemContent>
            <BirthDate date={summary.birthDate} />
          </List.ItemContent>
        </List.Item>

        <List.Item className="fr-mt-2v" isVisible={!!summary.position}>
          <List.ItemTitle>Poste actuel</List.ItemTitle>
          <List.ItemContent>{summary.position}</List.ItemContent>
        </List.Item>

        <List.Item isVisible={!!summary.lastPositionDate}>
          <List.ItemTitle>Durée sur le poste</List.ItemTitle>
          <List.ItemContent>
            <FormattedPositionDuration value={summary.lastPositionDate} />
          </List.ItemContent>
        </List.Item>

        <List.Item className="fr-mt-2v" isVisible={!!summary.rank}>
          <List.ItemTitle>Rang</List.ItemTitle>
          <List.ItemContent>{summary.rank}</List.ItemContent>
        </List.Item>

        <List.Item isVisible={!!summary.targetedPosition}>
          <List.ItemTitle>Poste pressenti</List.ItemTitle>
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
    <span>
      {str} ({age}&nbsp;ans)
    </span>
  );
}

function List(props: { children: React.ReactNode }) {
  return <dl>{props.children}</dl>;
}

List.ItemContent = (props: { children: React.ReactNode }) => <dd className="fr-pl-2v">{props.children}</dd>;
List.ItemTitle = (props: { children: string }) => <dt className="font-bold">{props.children}:</dt>;
List.Item = function Item(props: { className?: string; isVisible?: boolean; children: React.ReactNode }) {
  if (props.isVisible === false) return null;

  return <div className={`flex flex-row ${props.className ?? ''}`}>{props.children}</div>;
};
