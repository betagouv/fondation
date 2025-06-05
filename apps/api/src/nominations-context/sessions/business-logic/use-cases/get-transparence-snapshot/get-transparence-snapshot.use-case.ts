import { DateOnlyJson, Magistrat, TypeDeSaisine } from 'shared-models';
import { TransparenceRepository } from 'src/nominations-context/pp-gds/transparences/business-logic/gateways/repositories/transparence.repository';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { SessionSnapshot } from '../../../business-logic/models/session';

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
      const session = await this.transparenceRepository.byNomFormationEtDate(
        nom,
        formation,
        dateTransparence,
      )(transaction);

      if (!session) return null;

      return session.snapshot();
    });
  }
}
