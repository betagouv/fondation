import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import { type FC } from 'react';

import { LolfiMagistratLink } from '@/components/shared/LolfiMagistratLink';
import { PriorityBadgeList } from '@/components/shared/priorities/PriorityBadge';
import { labels } from '@/constants/labels.constants';
import type { DetailedReportDto } from '@api/types';
import { Card } from './Card';
import { formatBirthDate } from './formatters';

export type MagistratIdentityProps = Pick<
  DetailedReportDto,
  | 'name'
  | 'birthDate'
  | 'grade'
  | 'currentPosition'
  | 'targettedPosition'
  | 'rank'
  | 'dureeDuPoste'
  | 'sessionId'
  | 'nominationFileId'
  | 'priorities'
>;

export const MagistratIdentity: FC<MagistratIdentityProps> = ({
  name,
  birthDate,
  grade,
  currentPosition,
  targettedPosition,
  dureeDuPoste,
  rank,
  priorities,
  sessionId,
  nominationFileId
}) => {
  const formattedBirthDate = formatBirthDate(birthDate!, new Date());
  return (
    <Card label="Identité du magistrat">
      <header className="mb-6">
        <h1 className="mb-0 flex flex-row items-center">
          <span>{name}</span>
          <LolfiMagistratLink sessionId={sessionId} nominationFileId={nominationFileId} name={name} />
        </h1>
        <PriorityBadgeList priorities={priorities} small={false} />
      </header>
      <div>
        <span className={cx('fr-text--bold')}>{`${labels.magistrat.currentPosition} : `}</span>
        <span>{`${currentPosition} - ${grade}`}</span>
      </div>
      {dureeDuPoste && (
        <div>
          <span className={cx('fr-text--bold')}>{`${labels.magistrat.dureeDuPoste} : `}</span>
          <span>{dureeDuPoste}</span>
        </div>
      )}
      <div>
        <span className={cx('fr-text--bold')}>{`${labels.magistrat.targettedPosition} : `}</span>
        <span>{`${targettedPosition}`}</span>
      </div>
      <div>
        <span className={cx('fr-text--bold')}>{`${labels.magistrat.rank} : `}</span>
        <span>{`${rank}`}</span>
      </div>
      <div>
        <span className={cx('fr-text--bold')}>{`${labels.magistrat.birthDate} : `}</span>
        <span>{`${formattedBirthDate}`}</span>
      </div>
    </Card>
  );
};
