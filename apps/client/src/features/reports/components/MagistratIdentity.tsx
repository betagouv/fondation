import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import { type FC } from 'react';

import { labels } from '@/constants/labels.constants';
import { FormattedBirthDate } from '@/i18n/components';
import { LolfiMagistratLink } from '@/shared/components/LolfiMagistratLink';
import { PriorityBadgeList } from '@/shared/components/priorities/PriorityBadge';
import type { DetailedReportDto } from '@api/types';

import { Card } from './Card';

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
  nominationFileId,
}) => {
  return (
    <Card label="Identité du magistrat">
      <header className="fr-mb-6v">
        <h1 className="fr-mb-0 flex flex-row items-center">
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
        <span>
          <FormattedBirthDate value={birthDate} />
        </span>
      </div>
    </Card>
  );
};
