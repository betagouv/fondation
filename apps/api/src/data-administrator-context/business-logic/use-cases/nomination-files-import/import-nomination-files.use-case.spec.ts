import { Magistrat, NominationFile, Transparency } from 'shared-models';
import { FakeNominationFileRepository } from 'src/data-administrator-context/adapters/secondary/gateways/repositories/fake-nomination-file-repository';
import { DeterministicDateProvider } from 'src/shared-kernel/adapters/secondary/providers/deterministic-date-provider';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/providers/deterministic-uuid-generator';
import { FakeDomainEventRepository } from 'src/shared-kernel/adapters/secondary/repositories/fake-domain-event-repository';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';
import { EmptyFileError } from '../../errors/empty-file.error';
import { FileLengthTooShortError } from '../../errors/file-length-too-short.error';
import { NominationFilesImportedEvent } from '../../models/nomination-file-imported.event';
import { ImportNominationFilesUseCase } from './import-nomination-files.use-case';
import { NominationFileRead } from '../../models/nomination-file-read';
import { NominationFileModel } from '../../models/nomination-file';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/providers/null-transaction-performer';

const firstHeader = `								Eléments du dossier								Règles automatisées de gestion (pour débat) et statutaires (bloquantes)													Règles statutaires (bloquantes) et éléments qualitatifs à vérifier dans le dossier`;
const secondHeader = `Point(s) d'attention(s) repéré(s) dans le dossier	N° dossier                                                   	Magistrat	Formation	Date d'échéance	Etat	Transparence	Rapporteur(s)	Grade actuel	Poste actuel	Poste pressenti	Rang	Date de naissance	Historique	Observants		Mutation en - de 3 ans	Passer au 1er grade	Passe au grade "HH"	Prendre son grade sur place	Poste "profilé"	Nomination à la CC	"Outremer sur Outremer"	Siège <> Parquet et TJ <> CA	Siège <> Parquet du même ressort	Siège <> Parquet d'une même juridiction	Prendre son grade sur place après 7 ans	Ministère de la Justice à - de 3 ans d'exercice		Cabinet du ministre	Inscription au tableau pour prise de grade	Accéder à la HH sans avoir fait 2 postes au 1er grade	Prof. jur. dans le ressort du TJ il y a - de 5 ans	Conflit d'intérêt avec parcours pré magistrature	Conflit d'intérêt avec la prof. d'un proche	Evaluations	Eléments disciplinaires	Conditions de nomination HH 		Point d'attention sur ce dossier ?	Grade actuel	Intitulé du poste actuel	Reformulation du poste actuel	Date de prise du poste actuel	Lieu d'exercice du poste actuel (nom de la juridiction)	Localisation du poste actuel (Métropole ou Outremer)	Cour d'appel de rattachement du poste actuel	Poste au Ministère ?	Grade du poste pressenti	Titre du poste pressenti	Poste profilé ?	Intitulé du poste pressenti	Reformulation du poste pressenti, sans le grade II	Reformulation du poste pressenti, sans les grades II et I	Reformulation du poste pressenti, sans les grades II, I et HH	Lieu d'exercice du poste pressenti (nom de la juridiction)	Localisation du poste pressenti (Métropole ou Outremer)	Cour d'appel de rattachement du poste pressenti	Date pour la prise de poste (si nomination confirmée)	Observations`;
const allRulesValidatedLine = `TRUE	1 (parq.)	Marcel Dupont Ep. François 	Siège	10/11/2024	Nouveau	Automne 2024	LUC Loïc 	I	Avocat général - service extraordinaire CC  PARIS 	Premier avocat général CC  PARIS - HH 	(2 sur une liste de 2)	1/11/1961	- blablablablabla 	  JEAN PASCAL VPI TJ PARIS (9 sur une liste de 11)		TRUE	TRUE	TRUE	TRUE	TRUE	TRUE	TRUE	TRUE	TRUE	TRUE	TRUE	TRUE		TRUE	TRUE	TRUE	TRUE	TRUE	TRUE	TRUE	TRUE	TRUE		TRUE	I	Avocat général - service extraordinaire CC  PARIS	Avocat	mars 2022	PARIS	Métropole	CA PARIS	FALSE	HH	Premier	FALSE	Premier avocat général CC  PARIS - HH	Premier avocat général I  PARIS - HH	Premier avocat général CC  PARIS - I	Premier avocat général CC  PARIS	PARIS	Métropole	CA PARIS	septembre 2024	  MATHIAS PASCAL VPI TJ PARIS (9 sur une liste de 11)`;
const optionalFieldsAndOneRuleNotPrevalidated = `TRUE	3 (parq.)	Lucien Pierre 	Parquet		Avis restitué	Automne 2024	VICTOIRE Christian 	HH	Procureur de la République adjoint TJ  NIMES 	Avocat général CC  PARIS - HH 	2 sur une liste de 11)	22/8/1962	- blablablablabla 	   		TRUE	TRUE	TRUE	TRUE	TRUE	TRUE	TRUE	TRUE	TRUE	TRUE	TRUE	TRUE		FALSE	TRUE	TRUE	TRUE	TRUE	TRUE	TRUE	TRUE	TRUE		TRUE	HH	Procureur de la République adjoint TJ  NIMES	Procureur	septembre 2012	NIMES	Métropole	CA NIMES	FALSE	HH	Avocat	FALSE	Avocat général CC  PARIS - HH	Avocat général CC  PARIS - HH	Avocat général CC  PARIS - HH	Avocat général CC  PARIS	PARIS	Métropole	CA PARIS	septembre 2024`;

const fileToImportWithAllRulesPreValidated = `${firstHeader}
${secondHeader}
${allRulesValidatedLine}`;

const fileToImportWithOptionalsOneRuleNotPrevalidated = `${firstHeader}
${secondHeader}
${optionalFieldsAndOneRuleNotPrevalidated}`;

const fileToImportWithMultipleLines = `${firstHeader}
${secondHeader}
${allRulesValidatedLine}
${optionalFieldsAndOneRuleNotPrevalidated}`;

const nominationFilesImportedEventId = '1';

describe('Import Nomination Files Use Case', () => {
  let nominationFileRepository: FakeNominationFileRepository;
  let domainEventRepository: FakeDomainEventRepository;
  let dateTimeProvider: DeterministicDateProvider;
  let uuidGenerator: DeterministicUuidGenerator;
  let transactionPerformer: TransactionPerformer;

  beforeEach(() => {
    nominationFileRepository = new FakeNominationFileRepository();
    domainEventRepository = new FakeDomainEventRepository();
    transactionPerformer = new NullTransactionPerformer();
    dateTimeProvider = new DeterministicDateProvider();
    dateTimeProvider.currentDate = new Date(2024, 10, 10);
    uuidGenerator = new DeterministicUuidGenerator();
    uuidGenerator.nextUuids = [nominationFilesImportedEventId];
  });

  it.each([
    [{ fileToImport: `\t\t\t\t\t  `, expectedError: EmptyFileError }],
    [
      {
        fileToImport: `								Eléments du dossier								Règles automatisées de gestion (pour débat) et statutaires (bloquantes)													Règles statutaires (bloquantes) et éléments qualitatifs à vérifier dans le dossier
      Point(s) d'attention(s) repéré(s) dans le dossier	N° dossier                                                   	Magistrat	Formation	Date d'échéance	Etat	Transparence	Rapporteur(s)	Grade actuel	Poste actuel	Poste pressenti	Rang	Date de naissance	Historique	Observants		Mutation en - de 3 ans	Passer au 1er grade	Passe au grade "HH"	Prendre son grade sur place	Poste "profilé"	Nomination à la CC	"Outremer sur Outremer"	Siège <> Parquet et TJ <> CA	Siège <> Parquet du même ressort	Siège <> Parquet d'une même juridiction	Prendre son grade sur place après 7 ans	Ministère de la Justice à - de 3 ans d'exercice		Cabinet du ministre	Inscription au tableau pour prise de grade	Accéder à la HH sans avoir fait 2 postes au 1er grade	Prof. jur. dans le ressort du TJ il y a - de 5 ans	Conflit d'intérêt avec parcours pré magistrature	Conflit d'intérêt avec la prof. d'un proche	Evaluations	Eléments disciplinaires	Conditions de nomination HH 		Point d'attention sur ce dossier ?	Grade actuel	Intitulé du poste actuel	Reformulation du poste actuel	Date de prise du poste actuel	Lieu d'exercice du poste actuel (nom de la juridiction)	Localisation du poste actuel (Métropole ou Outremer)	Cour d'appel de rattachement du poste actuel	Poste au Ministère ?	Grade du poste pressenti	Titre du poste pressenti	Poste profilé ?	Intitulé du poste pressenti	Reformulation du poste pressenti, sans le grade II	Reformulation du poste pressenti, sans les grades II et I	Reformulation du poste pressenti, sans les grades II, I et HH	Lieu d'exercice du poste pressenti (nom de la juridiction)	Localisation du poste pressenti (Métropole ou Outremer)	Cour d'appel de rattachement du poste pressenti	Date pour la prise de poste (si nomination confirmée)	Observations`,
        expectedError: FileLengthTooShortError,
      },
    ],
  ])(
    'rejects a file with less than 3 lines',
    async ({ fileToImport, expectedError }) => {
      expect(importAFile(fileToImport)).rejects.toThrow(expectedError);
    },
  );

  it('informs about a new file imported', async () => {
    await importAFile(fileToImportWithAllRulesPreValidated);
    expectEvent(
      new NominationFilesImportedEvent(
        nominationFilesImportedEventId,
        { contents: [getMarcelDupontRead(1).content] },
        dateTimeProvider.currentDate,
      ),
    );
  });

  it('parses a line with all values filled and all rules pre-validated at true', async () => {
    const [nominationFileUuid] = uuidGenerator.genUuids(1);
    await importAFile(fileToImportWithAllRulesPreValidated);
    expectNominationFiles(getMarcelDupontModel(nominationFileUuid!, 1));
  });

  it('parses a line with possible empty values unfilled and one rule pre-validated at true', async () => {
    const [nominationFileUuid] = uuidGenerator.genUuids(1);
    await importAFile(fileToImportWithOptionalsOneRuleNotPrevalidated);
    expectNominationFiles(getLucienPierreModel(nominationFileUuid!, 1));
  });

  it('saves two lines', async () => {
    const [firstUuid, secondUuid] = uuidGenerator.genUuids(2);
    await importAFile(fileToImportWithMultipleLines);
    expectNominationFiles(
      getMarcelDupontModel(firstUuid!, 1),
      getLucienPierreModel(secondUuid!, 2),
    );
  });

  const importAFile = async (fileToImport: string) =>
    new ImportNominationFilesUseCase(
      nominationFileRepository,
      dateTimeProvider,
      uuidGenerator,
      transactionPerformer,
      domainEventRepository,
    ).execute(fileToImport);

  const expectEvent = async (...events: NominationFilesImportedEvent[]) =>
    expect(domainEventRepository.events).toEqual(events);

  const expectNominationFiles = async (
    ...nominationFiles: NominationFileModel[]
  ) =>
    expect(nominationFileRepository.nominationFiles).toEqual<
      FakeNominationFileRepository['nominationFiles']
    >(
      nominationFiles.reduce(
        (acc, nominationFile) => ({
          ...acc,
          [nominationFile.toSnapshot().rowNumber]: nominationFile,
        }),
        {},
      ),
    );

  const getMarcelDupontModel = (
    uuid: string,
    rowNumber = 1,
  ): NominationFileModel =>
    new NominationFileModel(uuid, null, getMarcelDupontRead(rowNumber));

  const getLucienPierreModel = (
    uuid: string,
    rowNumber = 1,
  ): NominationFileModel =>
    new NominationFileModel(uuid, null, getLucienPierreRead(rowNumber));

  const getMarcelDupontRead = (rowNumber = 1): NominationFileRead => ({
    rowNumber,
    content: {
      name: 'Marcel Dupont Ep. François',
      formation: Magistrat.Formation.SIEGE,
      dueDate: {
        year: 2024,
        month: 11,
        day: 10,
      },
      state: NominationFile.ReportState.NEW,
      transparency: Transparency.AUTOMNE_2024,
      reporter: 'LUC Loïc',
      grade: Magistrat.Grade.I,
      currentPosition: 'Avocat général - service extraordinaire CC  PARIS',
      targettedPosition: 'Premier avocat général CC  PARIS - HH',
      rank: '(2 sur une liste de 2)',
      birthDate: {
        year: 1961,
        month: 11,
        day: 1,
      },
      biography: '- blablablablabla',
      rules: getAllRulesPreValidated(),
    },
  });

  const getLucienPierreRead = (rowNumber = 1): NominationFileRead => ({
    rowNumber,
    content: {
      name: 'Lucien Pierre',
      formation: Magistrat.Formation.PARQUET,
      dueDate: null,
      state: NominationFile.ReportState.OPINION_RETURNED,
      transparency: Transparency.AUTOMNE_2024,
      reporter: 'VICTOIRE Christian',
      grade: Magistrat.Grade.HH,
      currentPosition: 'Procureur de la République adjoint TJ  NIMES',
      targettedPosition: 'Avocat général CC  PARIS - HH',
      rank: '2 sur une liste de 11)',
      birthDate: {
        year: 1962,
        month: 8,
        day: 22,
      },
      biography: '- blablablablabla',
      rules: getAllRulesPreValidated({ exceptRuleMinisterCabinet: true }),
    },
  });
});

export const getAllRulesPreValidated = (options?: {
  exceptRuleMinisterCabinet: true;
}): NominationFileRead['content']['rules'] => ({
  [NominationFile.RuleGroup.MANAGEMENT]: Object.values(
    NominationFile.ManagementRule,
  ).reduce(
    (acc, rule) => ({
      ...acc,
      [rule]: true,
    }),
    {} as NominationFileRead['content']['rules'][NominationFile.RuleGroup.MANAGEMENT],
  ),
  [NominationFile.RuleGroup.STATUTORY]: Object.values(
    NominationFile.StatutoryRule,
  ).reduce(
    (acc, rule) => ({
      ...acc,
      [rule]:
        options?.exceptRuleMinisterCabinet &&
        rule === NominationFile.StatutoryRule.MINISTER_CABINET
          ? false
          : true,
    }),
    {} as NominationFileRead['content']['rules'][NominationFile.RuleGroup.STATUTORY],
  ),
  [NominationFile.RuleGroup.QUALITATIVE]: Object.values(
    NominationFile.QualitativeRule,
  ).reduce(
    (acc, rule) => ({ ...acc, [rule]: true }),
    {} as NominationFileRead['content']['rules'][NominationFile.RuleGroup.QUALITATIVE],
  ),
});
