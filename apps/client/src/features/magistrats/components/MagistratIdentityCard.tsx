import React from 'react';
import { FormattedMessage } from 'react-intl';

import { FormattedAge, FormattedPositionDuration } from '@/i18n/components';
import { DetailsCard } from '@/shared/ui/details';
import { formatDateOnly, type PlainDateOnly } from '@/utils/date-only.util';
import { gradeAndPositionLabel } from '@/utils/position.utils';
import { capitalizedFirstName } from '@/utils/user.utils';
import type { DetailedMagistratDto } from '@api/types';

export function MagistratIdentityCard({
  magistrat,
  phoneNumbers,
}: {
  magistrat: DetailedMagistratDto;
  phoneNumbers?: React.ReactNode;
}) {
  const position = magistrat.currentPosition;
  const positionLabel = position
    ? [position.function?.label, position.jurisdiction.label].filter(Boolean).join(' ')
    : null;
  const currentPosition = gradeAndPositionLabel(magistrat.grade, positionLabel);

  return (
    <DetailsCard>
      <h2 className="fr-h4">
        <FormattedMessage defaultMessage="Informations personnelles" />
      </h2>
      <MagistratInfoList>
        <MagistratInfoItem label={<FormattedMessage defaultMessage="Nom" />}>
          {magistrat.lastName.toUpperCase()}
        </MagistratInfoItem>
        <MagistratInfoItem label={<FormattedMessage defaultMessage="Prénom" />}>
          {capitalizedFirstName(magistrat)}
        </MagistratInfoItem>
        <MagistratInfoItem label={<FormattedMessage defaultMessage="Nom d'usage" />}>
          {magistrat.usedName ? magistrat.usedName.toUpperCase() : '-'}
        </MagistratInfoItem>
        <MagistratInfoItem label={<FormattedMessage defaultMessage="Nom marital" />}>
          {magistrat.marriedName ? magistrat.marriedName.toUpperCase() : '-'}
        </MagistratInfoItem>
        <MagistratInfoItem label={<FormattedMessage defaultMessage="Date de naissance" />}>
          <InfoDate date={magistrat.birthDate} />
        </MagistratInfoItem>
        <MagistratInfoItem label={<FormattedMessage defaultMessage="Âge" />}>
          {magistrat.birthDate ? <FormattedAge value={magistrat.birthDate} /> : '-'}
        </MagistratInfoItem>
      </MagistratInfoList>

      <h2 className="fr-h4 fr-mt-8v">
        <FormattedMessage defaultMessage="Informations professionnelles" />
      </h2>
      <MagistratInfoList>
        <MagistratInfoItem label={<FormattedMessage defaultMessage="Poste actuel" />}>
          {currentPosition || '-'}
        </MagistratInfoItem>
        <MagistratInfoItem label={<FormattedMessage defaultMessage="Durée sur le poste" />}>
          {magistrat.installationDate ? (
            <FormattedPositionDuration value={magistrat.installationDate} />
          ) : (
            '-'
          )}
        </MagistratInfoItem>
        <MagistratInfoItem label={<FormattedMessage defaultMessage="Date de nomination" />}>
          <InfoDate date={magistrat.nominationDate} />
        </MagistratInfoItem>
        <MagistratInfoItem label={<FormattedMessage defaultMessage="Date d'installation" />}>
          <InfoDate date={magistrat.installationDate} />
        </MagistratInfoItem>
        <MagistratInfoItem label={<FormattedMessage defaultMessage="Date du grade" />}>
          <InfoDate date={magistrat.gradeDate} />
        </MagistratInfoItem>
      </MagistratInfoList>

      <h2 className="fr-h4 fr-mt-8v">
        <FormattedMessage defaultMessage="Informations de contact" />
      </h2>
      <MagistratInfoList>
        <MagistratInfoItem label={<FormattedMessage defaultMessage="Email" />}>
          {magistrat.professionalEmail?.toLowerCase() ?? '-'}
        </MagistratInfoItem>
      </MagistratInfoList>
      {phoneNumbers ? <div className="fr-mt-2v">{phoneNumbers}</div> : null}
    </DetailsCard>
  );
}

function InfoDate(props: { date: PlainDateOnly | null }) {
  if (!props.date) return '-';

  return formatDateOnly(props.date);
}

export function MagistratInfoList(props: { children: React.ReactNode }) {
  return <dl className="m-0 flex flex-col gap-2 p-0">{props.children}</dl>;
}

export function MagistratInfoItem(props: { children: React.ReactNode; label: React.ReactNode }) {
  return (
    <div className="leading-relaxed">
      <dt className="inline p-0 font-bold whitespace-nowrap">{props.label}</dt>{' '}
      <dd className="m-0 inline p-0">{props.children}</dd>
    </div>
  );
}
