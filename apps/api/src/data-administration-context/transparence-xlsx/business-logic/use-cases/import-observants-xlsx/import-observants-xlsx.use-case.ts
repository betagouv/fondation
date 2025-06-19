import { DateOnlyJson, Magistrat } from 'shared-models';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { TransparenceCsv } from '../../models/transparence-csv';
import { XlsxReader } from '../../models/xlsx-reader';
import { TransparenceService } from '../../services/transparence.service';
import { InvalidRowValueError } from 'src/data-administration-context/transparences/business-logic/errors/invalid-row-value.error';

export class ImportObservantsXlsxUseCase {
  constructor(
    private readonly transactionPerformer: TransactionPerformer,
    private readonly transparenceService: TransparenceService,
  ) {}

  async execute(
    file: File,
    formation: Magistrat.Formation,
    nomTransparence: string,
    dateTransparence: DateOnlyJson,
  ): Promise<{ validationError?: string }> {
    return await this.transactionPerformer.perform(async (trx) => {
      const xlsxRead = await XlsxReader.read(file);
      const transparenceCsv = TransparenceCsv.fromFichierXlsx(xlsxRead);

      try {
        const readCollection =
          this.transparenceService.readFromCsv(transparenceCsv);

        const transparence = await this.transparenceService.transparence(
          nomTransparence,
          formation,
          dateTransparence,
        )(trx);

        if (!transparence) {
          throw new Error(
            `Transparence not found: ${nomTransparence}, ${formation}, ${JSON.stringify(dateTransparence)}`,
          );
        }

        await this.transparenceService.updateTransparence(
          transparence,
          readCollection,
        )(trx);
      } catch (error) {
        console.error('Error while importing transparence xlsx:', error);

        if (error instanceof InvalidRowValueError) {
          return {
            validationError: error.message,
          };
        } else {
          throw error;
        }
      }

      return {};
    });
  }
}
