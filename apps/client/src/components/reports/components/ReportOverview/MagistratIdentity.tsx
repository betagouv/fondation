import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import { useMemo, type FC } from 'react';

import { LolfiMagistratLink } from '@/components/shared/LolfiMagistratLink';
import { labels } from '@/constants/labels.constants';
import { PrioriteEnumLabels } from '@/types/enums.types';
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
  const intlPriorities = useMemo(
    () =>
      new Intl.ListFormat('fr', { type: 'conjunction' }).format(priorities.map((p) => PrioriteEnumLabels[p])),
    [priorities]
  );

  const formattedBirthDate = formatBirthDate(birthDate!, new Date());
  return (
    <Card label="Identité du magistrat">
      <h1 className="flex flex-row items-center">
        <span>{name}</span>
        <LolfiMagistratLink sessionId={sessionId} nominationFileId={nominationFileId} name={name} />
      </h1>
      {priorities.length > 0 ? <p>{intlPriorities}</p> : null}
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
