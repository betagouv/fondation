import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { TransparenceRepository } from '../../gateways/repositories/transparence.repository';
import { Magistrat } from 'shared-models';
import { Transparence } from '../../models/transparence';
import { TypeDeSaisine } from '../../models/type-de-saisine';

export class ImportNouvelleTransparenceCommand {
  constructor(
    private readonly _typeDeSaisine: TypeDeSaisine,
    private readonly _transparenceName: string,
    private readonly _formations: Magistrat.Formation[],
  ) {}

  public get typeDeSaisine(): TypeDeSaisine {
    return this._typeDeSaisine;
  }
  public get formations(): Magistrat.Formation[] {
    return this._formations;
  }
  public get transparenceName(): string {
    return this._transparenceName;
  }

  static create(arg: {
    typeDeSaisine: TypeDeSaisine;
    transparenceName: string;
    formations: Magistrat.Formation[];
  }): ImportNouvelleTransparenceCommand {
    return new ImportNouvelleTransparenceCommand(
      arg.typeDeSaisine,
      arg.transparenceName,
      arg.formations,
    );
  }
}

export class ImportNouvelleTransparenceUseCase {
  constructor(
    private readonly transactionPerformer: TransactionPerformer,
    private readonly transparenceRepository: TransparenceRepository,
  ) {}

  execute(command: ImportNouvelleTransparenceCommand): Promise<void> {
    return this.transactionPerformer.perform(async (trx) => {
      const transparence = Transparence.nouvelle(
        command.typeDeSaisine,
        command.transparenceName,
        command.formations,
      );
      await this.transparenceRepository.save(transparence)(trx);
    });
  }
}
