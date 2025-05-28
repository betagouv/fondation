import xlsx from 'node-xlsx';
import { Magistrat } from 'shared-models';
import { FakeTransparenceRepository } from 'src/data-administration-context/transparence-xlsx/adapters/secondary/gateways/repositories/fake-transparence.repository';
import { FakeUserService } from 'src/data-administration-context/transparence-xlsx/adapters/secondary/gateways/services/fake-user.service';
import { TransparenceService } from 'src/data-administration-context/transparence-xlsx/business-logic/services/transparence.service';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-uuid-generator';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { FakeDomainEventRepository } from 'src/shared-kernel/adapters/secondary/gateways/repositories/fake-domain-event-repository';
import { DomainEventRepository } from 'src/shared-kernel/business-logic/gateways/repositories/domain-event.repository';
import { DomainRegistry } from '../../models/domain-registry';
import { NominationFileModelSnapshot } from '../../models/nomination-file';
import { TransparenceSnapshot } from '../../models/transparence';
import { TransparenceCsvSnapshot } from '../../models/transparence-csv';
import { lucLoïcUser } from './import-transparence-xlsx.fixtures';
import { ImportTransparenceXlsxUseCase } from './import-transparence-xlsx.use-case';

describe('Import Transparence XLSX Use Case', () => {
  let transparenceRepository: FakeTransparenceRepository;
  let domainEventRepository: DomainEventRepository;
  let userService: FakeUserService;

  beforeEach(() => {
    domainEventRepository = new FakeDomainEventRepository();
    transparenceRepository = new FakeTransparenceRepository();
    const uuidGenerator = new DeterministicUuidGenerator();
    uuidGenerator.nextUuids = [uneTransparenceCsv.id];
    DomainRegistry.setUuidGenerator(uuidGenerator);

    userService = new FakeUserService();
    userService.addUsers(lucLoïcUser);
  });

  it('enregistre un fichier XLSX', async () => {
    await new ImportTransparenceXlsxUseCase(
      new NullTransactionPerformer(),
      new TransparenceService(
        domainEventRepository,
        transparenceRepository,
        userService,
      ),
    ).execute(
      uneTransparenceXlsx,
      uneTransparence.formation,
      uneTransparence.name,
    );

    expect(transparenceRepository.getTransparences()).toEqual([
      uneTransparence,
    ]);
  });
});

const uneDate = new Date(2024, 10, 10);
const unDossierSiège: NominationFileModelSnapshot = {
  id: 'un-dossier-siege-id',
  createdAt: uneDate,
  rowNumber: 1,
  content: {
    historique: 'Une biographie siège',
    dateDeNaissance: {
      year: 1980,
      month: 1,
      day: 1,
    },
    posteActuel: 'Une position actuelle siège',
    dateDeNaissance: null,
    numeroDeDossier: 12345,
    grade: Magistrat.Grade.II,
    magistratName: 'Un Dossier Siège',
    observers: ['observer-id-1', 'observer-id-2'],
    rank: 'Un rang siège',
    reporters: ['reporter-id-1', 'reporter-id-2'],
    posteCible: 'Président CA MARSEILLE - HH',
  },
};
const uneTransparence: TransparenceSnapshot = {
  id: 'une-transparence-id',
  createdAt: uneDate,
  formation: Magistrat.Formation.SIEGE,
  name: 'Une Transparence',
  nominationFiles: [unDossierSiège],
};

const uneTransparenceCsv: TransparenceCsvSnapshot = {
  id: 'une-transparence-id',
  nom: 'une-transparence.xlsx',
  csv: 'un\tcsv\nligne,\t2',
};

const data = [
  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'],
  [
    'N° dossier',
    'Magistrat',
    'Poste cible',
    'Date de naissance',
    'Poste actuel',
    'Prise de fonction',
    'Passage au grade',
    'Eq./Av.',
    'Observants',
    'Rapporteur',
    'Information carrière',
    'Historique',
    'Rapporteur 1',
    'Rapporteur 2',
    'Rapporteur 3 (note de synthèse pour le président de formation)',
  ],
  [
    '12345',
    'Clara GRANDE ep. QUIMPER (1 sur une liste de 7)',
    'Procureur de la République TJ  MONTESQUIEUX – I',
    '25/01/1971',
    'Procureur de la République TJ  CAMBRAI',
    '5/09/2021',
    '27/03/2012',
    'E',
    '',
    'Clara GRANDE',
    '',
    '- Biographie de Clara GRANDE',
    'Patrick TITIUN',
  ],
  [
    '12346',
    'Patrick TITIUN (1 sur une liste de 1)',
    'Substitut général chargé du secrétariat général CA  BELLEVILLE - I',
    '02/02/1973',
    'Vice - procureur de la République TJ  BERGERAC',
    '02/01/2024',
    '10/12/2010',
    'E',
    '',
    'Patrick TITIUN',
    '- Stage fantastique',
    'Patrick TITIUN',
    'Clara GRANDE',
  ],
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
