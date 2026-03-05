import { LolfiMagistratLink } from '@/components/shared/LolfiMagistratLink';
import { PrioriteEnumLabels, type PrioriteEnum } from '@/types/enums.types';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import { useMemo, type FC } from 'react';
import { ReportVM } from '../../../../VM/ReportVM';
import { Card } from './Card';

export type MagistratIdentityProps = Pick<
  ReportVM,
  'name' | 'birthDate' | 'grade' | 'currentPosition' | 'targettedPosition' | 'rank' | 'dureeDuPoste'
> & { priorities: PrioriteEnum[]; sessionId: string; nominationFileId: string };

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

  return (
    <Card label="Identité du magistrat">
      <h1 className="flex flex-row items-center">
        <span>{name}</span>
        <LolfiMagistratLink sessionId={sessionId} nominationFileId={nominationFileId} name={name} />
      </h1>
      {priorities.length > 0 ? <p>{intlPriorities}</p> : null}
      <div>
        <span
          className={cx('fr-text--bold')}
        >{`${ReportVM.magistratIdentityLabels.currentPosition} : `}</span>
        <span>{`${currentPosition} - ${grade}`}</span>
      </div>
      {dureeDuPoste && (
        <div>
          <span className={cx('fr-text--bold')}>{`${ReportVM.magistratIdentityLabels.dureeDuPoste} : `}</span>
          <span>{dureeDuPoste}</span>
        </div>
      )}
      <div>
        <span
          className={cx('fr-text--bold')}
        >{`${ReportVM.magistratIdentityLabels.targettedPosition} : `}</span>
        <span>{`${targettedPosition}`}</span>
      </div>
      <div>
        <span className={cx('fr-text--bold')}>{`${ReportVM.magistratIdentityLabels.rank} : `}</span>
        <span>{`${rank}`}</span>
      </div>
      <div>
        <span className={cx('fr-text--bold')}>{`${ReportVM.magistratIdentityLabels.birthDate} : `}</span>
        <span>{`${birthDate}`}</span>
      </div>
    </Card>
  );
};
