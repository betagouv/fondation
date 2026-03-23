import { differenceInMonths, differenceInYears } from 'date-fns';
import React from 'react';

import { DateOnly } from '@/models/date-only.model';

import { LolfiMagistratLink } from '@/components/shared/LolfiMagistratLink';
import { PriorityBadgeList } from '@/components/shared/priorities/PriorityBadge';
import { useSummary } from '@/pages/summary/SummaryContext';
import { SummarySectionCard } from './SummarySectionCard';

export function SummarySectionMagistrat() {
  const { summary, sessionId, nominationFileId } = useSummary();

  return (
    <SummarySectionCard id="magistrat">
      <header className="mb-6">
        <h1 className="mb-0 flex flex-row items-center">
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

        <List.Item className="mt-2" isVisible={!!summary.position}>
          <List.ItemTitle>Poste actuel</List.ItemTitle>
          <List.ItemContent>{summary.position}</List.ItemContent>
        </List.Item>

        <List.Item isVisible={!!summary.lastPositionDate}>
          <List.ItemTitle>Durée sur le poste</List.ItemTitle>
          <List.ItemContent>
            <Duration date={summary.lastPositionDate} />
          </List.ItemContent>
        </List.Item>

        <List.Item className="mt-2" isVisible={!!summary.rank}>
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
  const birthDateOnly = DateOnly.fromStoreModel(props.date);
  const date = birthDateOnly.toDate();
  const str = birthDateOnly.toFormattedString('dd/MM/yyyy');

  const age = differenceInYears(now, date);

  return (
    <span>
      {str} ({age}&nbsp;ans)
    </span>
  );
}

function Duration(props: { date: { day: number; month: number; year: number } | null }) {
  if (!props.date) return null;

  const date = DateOnly.fromStoreModel(props.date).toDate();
  const now = new Date();

  const totalMonths = differenceInMonths(now, date);

  const years = Math.round(totalMonths / 12);
  const months = Math.round((totalMonths / 12 - years) * 12);

  const yearStr = years < 1 ? undefined : years > 1 ? `${years} ans` : `${years} an`;
  const monthStr = months < 1 ? undefined : `${months} mois`;

  return new Intl.ListFormat('fr-FR', { type: 'conjunction' }).format(
    [yearStr, monthStr].filter((x): x is string => !!x)
  );
}

function List(props: { children: React.ReactNode }) {
  return <dl>{props.children}</dl>;
}

List.ItemContent = (props: { children: React.ReactNode }) => <dd className="pl-2">{props.children}</dd>;
List.ItemTitle = (props: { children: string }) => <dt className="font-bold">{props.children}:</dt>;
List.Item = function Item(props: { className?: string; isVisible?: boolean; children: React.ReactNode }) {
  if (props.isVisible === false) return null;

  return <div className={`flex flex-row ${props.className ?? ''}`}>{props.children}</div>;
};
