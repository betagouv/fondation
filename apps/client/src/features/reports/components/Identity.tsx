import { DetailsLink } from '@/shared/components/details-link';
import { IdentityList } from '@/shared/components/identity-list';
import { LolfiLink } from '@/shared/components/lolfi-link';
import { PriorityBadgeList } from '@/shared/components/priority-badge';
import { TitleNameIcons } from '@/shared/components/title-name-icons';
import type { DetailedReportDto } from '@api/types';

import { Card } from './Card';

export type IdentityProps = Pick<
  DetailedReportDto,
  | 'birthDate'
  | 'currentPosition'
  | 'detectedMagistratId'
  | 'dureeDuPoste'
  | 'grade'
  | 'name'
  | 'nominationFileId'
  | 'priorities'
  | 'rank'
  | 'sessionId'
  | 'targetedGrade'
  | 'targettedPosition'
>;

export function Identity({
  birthDate,
  currentPosition,
  detectedMagistratId,
  dureeDuPoste,
  grade,
  name,
  nominationFileId,
  priorities,
  rank,
  sessionId,
  targetedGrade,
  targettedPosition,
}: IdentityProps) {
  return (
    <Card label="Identité du magistrat">
      <header className="fr-mb-6v">
        <h1 className="fr-mb-0">
          <TitleNameIcons name={name}>
            <DetailsLink context="membre" magistratId={detectedMagistratId} />
            <LolfiLink name={name} nominationFileId={nominationFileId} sessionId={sessionId} />
          </TitleNameIcons>
        </h1>
        <PriorityBadgeList priorities={priorities} small={false} />
      </header>
      <IdentityList
        birthDate={birthDate}
        currentPosition={currentPosition}
        grade={grade}
        positionDuration={dureeDuPoste}
        rank={rank}
        targetedGrade={targetedGrade}
        targetedPosition={targettedPosition}
      />
    </Card>
  );
}
