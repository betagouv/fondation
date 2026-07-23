import { forwardRef, Inject, Injectable } from '@nestjs/common';

import { LolfiTransparenceFile } from '../../domain/transparence-file';
import { IngestService } from 'src/modules/ingest/infrastructure/ingest.service';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { DateOnly } from 'src/utils/date-only';
import { assertIsDefined } from 'src/utils/is-defined';

@Injectable()
export class LolfiTransparenceFilesFinder {
  constructor(
    @Inject(forwardRef(() => IngestService))
    private readonly ingest: IngestService,
  ) {}

  async find(sessionId: number): Promise<Record<FormationEnum, { items: LolfiTransparenceFile[] }>> {
    const { items: files } = await this.ingest.internalDetailsLolfiSession(sessionId);

    const parquet: LolfiTransparenceFile[] = [];
    const siege: LolfiTransparenceFile[] = [];

    for (const file of files) {
      const nominationFile: LolfiTransparenceFile = {
        fileNumber: NaN,
        externalId: file.externalId,
        name: file.magistrat.name,
        biography: file.magistrat.biography,
        birthDate: DateOnly.fromOptionalDate(file.magistrat.birthDate),
        careerInformation: null,
        currentPosition: capitalize(file.magistrat.currentPosition ?? ''),
        grade: assertIsDefined(file.magistrat.grade, 'Magistrat LOLFI has no grade'),
        lastPositionDate: DateOnly.fromOptionalDate(file.lastPositionDate),
        lastRankingDate: DateOnly.fromOptionalDate(file.lastRankingDate),
        rank: file.rank,
        targetedGrade: file.targetedGrade,
        targetedPosition: capitalize(
          assertIsDefined(file.targetedPosition, 'Magistrat LOLFI has not targeted position'),
        ),

        priorities: file.priorities,

        detectedMagistratId: file.magistrat.id,
        sortableTargetedGrade: file.sortableTargetedGrade,
        detectedTargetedFunctionId: file.detectedTargetedFunctionId,
        detectedTargetedPositionId: file.detectedTargetedPositionId,
        detectedJurisdictionId: file.detectedJurisdictionId,
      };

      if (file.formation === 'PARQUET') {
        nominationFile.fileNumber = parquet.length + 1;
        parquet.push(nominationFile);
      } else {
        nominationFile.fileNumber = siege.length + 1;
        siege.push(nominationFile);
      }
    }

    return {
      ['PARQUET']: { items: parquet },
      ['SIEGE']: { items: siege },
    };
  }
}

function capitalize(input: string): string {
  return input[0]?.toUpperCase() + input.slice(1);
}
