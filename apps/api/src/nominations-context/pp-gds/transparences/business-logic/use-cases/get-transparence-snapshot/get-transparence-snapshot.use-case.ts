import { DateOnlyJson, Magistrat, TypeDeSaisine } from 'shared-models';
import { SessionSnapshot } from 'shared-models/models/session/session-content';
import { TransparenceRepository } from 'src/nominations-context/pp-gds/transparences/business-logic/gateways/repositories/transparence.repository';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export class GetTransparenceSnapshotUseCase {
  constructor(
    private readonly transparenceRepository: TransparenceRepository,
    private readonly transactionPerformer: TransactionPerformer,
  ) {}

  async execute(
    nom: string,
    formation: Magistrat.Formation,
    dateTransparence: DateOnlyJson,
  ): Promise<SessionSnapshot<TypeDeSaisine.TRANSPARENCE_GDS> | null> {
    return this.transactionPerformer.perform(async (transaction) => {
      const transparence =
        await this.transparenceRepository.byNomFormationEtDate(
          nom,
          formation,
          dateTransparence,
        )(transaction);

      if (!transparence) return null;

      return transparence.snapshot();
    });
  }
}
