import type React from 'react';
import { FormattedMessage } from 'react-intl';

import { FormattedBirthDate } from '@/i18n/components';
import { BiographyList } from '@/shared/components/biography-list';
import { DetailsCard } from '@/shared/ui/details';
import { gradeAndPositionLabel } from '@/utils/position.utils';
import type { DetailedReportDto } from '@api/types';

export type ReportMagistrat = Pick<
  DetailedReportDto,
  | 'biography'
  | 'birthDate'
  | 'currentPosition'
  | 'dureeDuPoste'
  | 'grade'
  | 'rank'
  | 'targetedGrade'
  | 'targettedPosition'
>;

export function ReportMagistratCard({ report }: { report: ReportMagistrat }) {
  const currentPosition = gradeAndPositionLabel(report.grade, report.currentPosition);
  const targetedPosition = gradeAndPositionLabel(report.targetedGrade, report.targettedPosition);

  return (
    <DetailsCard>
      <h2 className="fr-h6">
        <FormattedMessage defaultMessage="Informations professionnelles" />
      </h2>
      <InfoList>
        <InfoItem label={<FormattedMessage defaultMessage="Date de naissance" />}>
          {report.birthDate ? <FormattedBirthDate value={report.birthDate} /> : '-'}
        </InfoItem>
        <InfoItem label={<FormattedMessage defaultMessage="Poste actuel" />}>
          {currentPosition || '-'}
        </InfoItem>
        <InfoItem label={<FormattedMessage defaultMessage="Durée sur le poste" />}>
          {report.dureeDuPoste ?? '-'}
        </InfoItem>
        <InfoItem label={<FormattedMessage defaultMessage="Poste cible" />}>
          {targetedPosition || '-'}
        </InfoItem>
        <InfoItem label={<FormattedMessage defaultMessage="Rang" />}>
          {report.rank ? report.rank.replace(/^\(|\)$/g, '') : '-'}
        </InfoItem>
      </InfoList>

      <h2 className="fr-h6 fr-mt-8v">
        <FormattedMessage defaultMessage="Biographie" />
      </h2>
      {report.biography ? (
        <BiographyList biography={report.biography} />
      ) : (
        <p className="fr-mb-0">
          <FormattedMessage defaultMessage="Aucune biographie" />
        </p>
      )}
    </DetailsCard>
  );
}

function InfoList(props: { children: React.ReactNode }) {
  return <dl className="m-0 flex flex-col gap-2 p-0">{props.children}</dl>;
}

function InfoItem(props: { children: React.ReactNode; label: React.ReactNode }) {
  return (
    <div className="leading-relaxed">
      <dt className="inline p-0 font-bold whitespace-nowrap">{props.label}</dt>{' '}
      <dd className="m-0 inline p-0">{props.children}</dd>
    </div>
  );
}
