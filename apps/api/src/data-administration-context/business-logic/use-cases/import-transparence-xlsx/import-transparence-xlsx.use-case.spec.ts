import xlsx from 'node-xlsx';
import { FakeTransparenceCsvRepository } from 'src/data-administration-context/adapters/secondary/gateways/repositories/fake-transparence-csv.repository';
import { NouvelleTransparenceXlsxImportedEvent } from 'src/data-administration-context/business-logic/models/events/nouvelle-transparence-xlsx-imported.event';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-uuid-generator';
import { FakeDomainEventPublisher } from 'src/shared-kernel/adapters/secondary/gateways/providers/fake-domain-event-publisher';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { FakeDomainEventRepository } from 'src/shared-kernel/adapters/secondary/gateways/repositories/fake-domain-event-repository';
import { DomainRegistry } from '../../models/domain-registry';
import { TransparenceCsvSnapshot } from '../../models/transparence-csv';
import { ImportTransparenceXlsxUseCase } from './import-transparence-xlsx.use-case';

describe('Import Transparence XLSX Use Case', () => {
  const transparenceXlsxRepository = new FakeTransparenceCsvRepository();
  const domainEventPublisher = new FakeDomainEventPublisher();
  const domainEventRepository = new FakeDomainEventRepository();

  beforeEach(() => {
    const uuidGenerator = new DeterministicUuidGenerator();
    uuidGenerator.nextUuids = [uneTransparenceCsv.id];
    DomainRegistry.setUuidGenerator(uuidGenerator);
  });

  it('enregistre un fichier XLSX', async () => {
    await new ImportTransparenceXlsxUseCase(
      transparenceXlsxRepository,
      new NullTransactionPerformer(),
      domainEventPublisher,
    ).execute(uneTransparenceXlsx);

    expect(transparenceXlsxRepository.getFichiers()).toEqual([
      uneTransparenceCsv,
    ]);
  });

  it('Doit publier un évènement de création de transparence', async () => {
    await new ImportTransparenceXlsxUseCase(
      transparenceXlsxRepository,
      new NullTransactionPerformer(),
      domainEventPublisher,
    ).execute(uneTransparenceXlsx);

    expect(domainEventRepository.events[0]).toEqual({
      type: NouvelleTransparenceXlsxImportedEvent.name,
      payload: {
        transparenceId: uneTransparenceCsv.id,
        filename: uneTransparenceCsv.nom,
        data: data,
      },
    });
  });
});

const uneTransparenceCsv: TransparenceCsvSnapshot = {
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
const uneTransparenceXlsx = new File([buffer], uneTransparenceCsv.nom, {
  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
});
