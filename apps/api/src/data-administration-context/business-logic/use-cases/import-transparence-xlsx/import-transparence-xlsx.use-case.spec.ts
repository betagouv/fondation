import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { ImportTransparenceXlsxUseCase } from './import-transparence-xlsx.use-case';
import { FakeTransparenceCsvRepository } from 'src/data-administration-context/adapters/secondary/gateways/repositories/fake-transparence-csv.repository';
import { TransparenceCsvSnapshot } from '../../models/transparence-csv';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-uuid-generator';
import { DomainRegistry } from '../../models/domain-registry';
import xlsx from 'node-xlsx';

describe('Import Transparence XLSX Use Case', () => {
  it('enregistre un fichier XLSX', async () => {
    const transparenceXlsxRepository = new FakeTransparenceCsvRepository();
    const uuidGenerator = new DeterministicUuidGenerator();
    uuidGenerator.nextUuids = [uneTransparenceCSv.id];
    DomainRegistry.setUuidGenerator(uuidGenerator);

    await new ImportTransparenceXlsxUseCase(
      transparenceXlsxRepository,
      new NullTransactionPerformer(),
    ).execute(uneTransparenceXlsx);

    expect(transparenceXlsxRepository.getFichiers()).toEqual([
      uneTransparenceCSv,
    ]);
  });
});

const uneTransparenceCSv: TransparenceCsvSnapshot = {
  id: 'une-transparence-id',
  nom: 'une-transparence.xlsx',
  csv: 'un\tcsv\nligne,\t2',
};
const data = [
  ['un', 'csv'],
  ['ligne,', '2'],
];
const buffer = xlsx.build([
  {
    name: 'mySheetName',
    data: data,
    options: {},
  },
]);
const uneTransparenceXlsx = new File([buffer], uneTransparenceCSv.nom, {
  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
});
