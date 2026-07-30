import { IdentityList } from '@/shared/components/identity-list';
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
          <TitleNameIcons
            detailsLink={{
              context: 'membre',
              magistratId: detectedMagistratId,
            }}
            lolfi={{ nominationFileId, sessionId }}
            name={name}
          />
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
