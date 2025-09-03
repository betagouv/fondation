import {
  TransparenceSnapshot,
  TransparenceSnapshotQueryParamsDto,
} from 'shared-models';
import { TransparenceService } from 'src/data-administration-context/transparence-xlsx/business-logic/services/transparence.service';

import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export class GetTransparenceSnapshotUseCase {
  constructor(
    private readonly transactionPerformer: TransactionPerformer,
    private readonly transparenceService: TransparenceService,
  ) {}

  async execute(
    dto: TransparenceSnapshotQueryParamsDto,
  ): Promise<TransparenceSnapshot | null> {
    return this.transactionPerformer.perform(async (trx) => {
      const transparence = await this.transparenceService.transparence(
        dto.nom,
        dto.formation,
        {
          year: dto.year,
          month: dto.month,
          day: dto.day,
        },
      )(trx);

      if (!transparence) return null;

      const snapshot = transparence.snapshot();

      return {
        id: snapshot.id,
        name: snapshot.name,
        formation: snapshot.formation,
        dateTransparence: snapshot.dateTransparence,
        dateEcheance: snapshot.dateEchéance,
        datePriseDePosteCible: snapshot.datePriseDePosteCible,
        dateClotureDelaiObservation: snapshot.dateClôtureDélaiObservation,
      };
    });
  }
}
