import React from 'react';
import { FormattedMessage } from 'react-intl';

import { FormattedAge, FormattedPositionDuration } from '@/i18n/components';
import { DetailsCard } from '@/shared/ui/details';
import { dateOnlyToDate, type PlainDateOnly } from '@/utils/date-only.util';
import type { DetailedMagistratDto } from '@api/types';

export function MagistratIdentityCard({ magistrat }: { magistrat: DetailedMagistratDto }) {
  const currentPosition = [magistrat.grade, magistrat.currentPosition].filter(Boolean).join(' - ');

  return (
    <DetailsCard background="terreBattue">
      <h2 className="fr-h4">
        <FormattedMessage defaultMessage="Informations personnelles" />
      </h2>
      <InfoList>
        <InfoItem label={<FormattedMessage defaultMessage="Nom" />}>
          {magistrat.lastName.toUpperCase()}
        </InfoItem>
        <InfoItem label={<FormattedMessage defaultMessage="Prénom" />}>{magistrat.firstName}</InfoItem>
        <InfoItem label={<FormattedMessage defaultMessage="Nom d'usage" />}>
          {magistrat.usedName ? magistrat.usedName.toUpperCase() : '-'}
        </InfoItem>
        <InfoItem label={<FormattedMessage defaultMessage="Date de naissance" />}>
          <InfoDate date={magistrat.birthDate} />
        </InfoItem>
        <InfoItem label={<FormattedMessage defaultMessage="Âge" />}>
          {magistrat.birthDate ? <FormattedAge value={magistrat.birthDate} /> : '-'}
        </InfoItem>
      </InfoList>

      <h2 className="fr-h4 fr-mt-8v">
        <FormattedMessage defaultMessage="Informations professionnelles" />
      </h2>
      <InfoList>
        <InfoItem label={<FormattedMessage defaultMessage="Poste actuel" />}>
          {currentPosition || '-'}
        </InfoItem>
        <InfoItem label={<FormattedMessage defaultMessage="Durée sur le poste" />}>
          {magistrat.installationDate ? (
            <FormattedPositionDuration value={magistrat.installationDate} />
          ) : (
            '-'
          )}
        </InfoItem>
        <InfoItem label={<FormattedMessage defaultMessage="Date de nomination" />}>
          <InfoDate date={magistrat.nominationDate} />
        </InfoItem>
        <InfoItem label={<FormattedMessage defaultMessage="Date d'installation" />}>
          <InfoDate date={magistrat.installationDate} />
        </InfoItem>
        <InfoItem label={<FormattedMessage defaultMessage="Date du grade" />}>
          <InfoDate date={magistrat.gradeDate} />
        </InfoItem>
        <InfoItem label={<FormattedMessage defaultMessage="Email" />}>
          {magistrat.professionalEmail ?? '-'}
        </InfoItem>
      </InfoList>
    </DetailsCard>
  );
}

function InfoDate(props: { date: PlainDateOnly | null }) {
  if (!props.date) return '-';

  return (
    <FormattedMessage
      defaultMessage="{date, date, dateOnlyShort}"
      values={{ date: dateOnlyToDate(props.date) }}
    />
  );
}

function InfoList(props: { children: React.ReactNode }) {
  return <dl className="m-0 flex flex-col gap-2 p-0">{props.children}</dl>;
}

function InfoItem(props: { children: React.ReactNode; label: React.ReactNode }) {
  return (
    <div>
      <dt className="inline p-0 font-bold whitespace-nowrap">{props.label}</dt>{' '}
      <dd className="m-0 inline p-0">{props.children}</dd>
    </div>
  );
}
