import { DateOnlyJson, Magistrat, Transparency } from 'shared-models';
import { Avancement } from 'src/data-administration-context/lodam/business-logic/models/avancement';
import { TransparenceXlsxImportéeEventPayload } from 'src/data-administration-context/transparence-xlsx/business-logic/models/events/transparence-xlsx-importée.event';
import { getDependencies } from 'src/nominations-context/tests-dependencies';
import { ImportNouvelleTransparenceXlsxCommand } from '../use-cases/import-nouvelle-transparence-xlsx/Import-nouvelle-transparence-xlsx.command';
import { TransparenceXlsxImportéeSubscriber } from './transparence-xlsx-importée.subscriber';

describe('Transparence XLSX importée subscriber', () => {
  let dependencies: ReturnType<typeof getDependencies>;

  beforeEach(() => {
    dependencies = getDependencies();
    dependencies.importNouvelleTransparenceXlsxUseCase.execute = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('appelle le use case avec une commande bien formée', async () => {
    await listenEvent();

    expect(
      dependencies.importNouvelleTransparenceXlsxUseCase.execute,
    ).toHaveBeenCalledExactlyOnceWith(
      new ImportNouvelleTransparenceXlsxCommand(
        uneTransparenceId,
        uneTransparence,
        uneFormation,
        uneDateEchéance,
        uneDateTransparence,
        uneDateClôtureDélaiObservation,
        [nominationFilePayload],
      ),
    );
  });

  const listenEvent = () =>
    new TransparenceXlsxImportéeSubscriber(
      dependencies.importNouvelleTransparenceXlsxUseCase,
    ).handle(xlsxImportPayload);
});

const uneTransparenceId = 'une-transparence-id';
const uneTransparence = Transparency.AUTOMNE_2024;
const uneFormation = Magistrat.Formation.SIEGE;
const uneDateEchéance: DateOnlyJson = { year: 2025, month: 1, day: 1 };
const uneDateTransparence: DateOnlyJson = { year: 2024, month: 1, day: 1 };
const uneDateClôtureDélaiObservation: DateOnlyJson = {
  year: 2023,
  month: 10,
  day: 1,
};

const nominationFilePayload: TransparenceXlsxImportéeEventPayload['nominationFiles'][0] =
  {
    nominationFileId: 'nomination-file-id',
    content: {
      historique: 'biography',
      dateDeNaissance: {
        day: 1,
        month: 1,
        year: 2000,
      },
      posteActuel: 'currentPosition',
      posteCible: 'targettedPosition',
      datePassageAuGrade: {
        day: 1,
        month: 1,
        year: 2000,
      },
      numeroDeDossier: 1,
      grade: Magistrat.Grade.I,
      magistrat: 'name',
      rank: 'rank',
      reporterIds: ['reporter-id'],
      datePriseDeFonctionPosteActuel: {
        day: 1,
        month: 1,
        year: 2021,
      },
      informationCarriere: 'Carrière',
      observers: [],
      equivalenceOuAvancement: Avancement.AVANCEMENT,
    },
  };

const xlsxImportPayload: TransparenceXlsxImportéeEventPayload = {
  transparenceId: uneTransparenceId,
  transparenceName: uneTransparence,
  formation: uneFormation,
  dateEchéance: { year: 2025, month: 1, day: 1 },
  dateTransparence: { year: 2024, month: 1, day: 1 },
  dateClôtureDélaiObservation: { year: 2023, month: 10, day: 1 },
  nominationFiles: [nominationFilePayload],
};
