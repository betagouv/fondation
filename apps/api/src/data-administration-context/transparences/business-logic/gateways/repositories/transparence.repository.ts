import { DateOnlyJson, Magistrat } from 'shared-models';
import { Transparence as TransparenceTsv } from 'src/data-administration-context/transparence-tsv/business-logic/models/transparence';
import { Transparence as TransparenceXlsx } from 'src/data-administration-context/transparence-xlsx/business-logic/models/transparence';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export interface TransparenceRepository {
  save(transparence: TransparenceTsv | TransparenceXlsx): TransactionableAsync;
  transparence(
    name: string,
    formation: Magistrat.Formation,
    dateTransparence: DateOnlyJson,
  ): TransactionableAsync<TransparenceXlsx | null>;
  setFile(transparenceId: string, fileId: string): TransactionableAsync;
}
