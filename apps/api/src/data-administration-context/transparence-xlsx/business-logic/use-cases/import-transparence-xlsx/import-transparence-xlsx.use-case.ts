import { DateOnlyJson, Magistrat, TransparenceSnapshot } from 'shared-models';
import { InvalidRowValueError } from 'src/data-administration-context/transparences/business-logic/errors/invalid-row-value.error';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { TransparenceCsv } from '../../models/transparence-csv';
import { XlsxReader } from '../../models/xlsx-reader';
import { TransparenceService } from '../../services/transparence.service';

export class ImportTransparenceXlsxUseCase {
  constructor(
    private readonly transactionPerformer: TransactionPerformer,
    private readonly transparenceService: TransparenceService,
  ) {}

  async execute(
    file: File,
    formation: Magistrat.Formation,
    nomTransparence: string,
    dateTransparence: DateOnlyJson,
    dateEchéance: DateOnlyJson | null,
    datePriseDePosteCible: DateOnlyJson | null,
    dateClôtureDélaiObservation: DateOnlyJson,
  ): Promise<{ validationError?: string } | TransparenceSnapshot> {
    return await this.transactionPerformer.perform(async (trx) => {
      const xlsxRead = await XlsxReader.read(file);
      const transparenceCsv = TransparenceCsv.fromFichierXlsx(xlsxRead);

      const transparence = await this.transparenceService.transparence(
        nomTransparence,
        formation,
        dateTransparence,
      )(trx);
      if (transparence) {
        throw new Error(
          `Transparence already exists: ${nomTransparence}, ${formation}, ${JSON.stringify(dateTransparence)}`,
        );
      }

      try {
        const readCollection =
          this.transparenceService.readFromCsv(transparenceCsv);

        const transparence =
          await this.transparenceService.nouvelleTransparence(
            nomTransparence,
            formation,
            dateTransparence,
            dateEchéance,
            datePriseDePosteCible,
            dateClôtureDélaiObservation,
            readCollection,
          )(trx);

        return transparence.sharedModelSnapshot();
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
    });
  }
}
