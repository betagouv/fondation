import { DateOnlyJson, Magistrat } from 'shared-models';
import {
  TransparenceXlsxImportéeEvent,
  TransparenceXlsxImportéeEventPayload,
} from 'src/data-administration-context/transparence-xlsx/business-logic/models/events/transparence-xlsx-importée.event';
import { TransparenceService } from 'src/data-administration-context/transparence-xlsx/business-logic/services/transparence.service';
import { FakeTransparenceRepository } from 'src/data-administration-context/transparences/adapters/secondary/gateways/repositories/fake-transparence.repository';
import { FakeUserService } from 'src/data-administration-context/transparences/adapters/secondary/gateways/services/fake-user.service';
import { DeterministicDateProvider } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-date-provider';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-uuid-generator';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { FakeDomainEventRepository } from 'src/shared-kernel/adapters/secondary/gateways/repositories/fake-domain-event-repository';
import { DomainRegistry } from '../../../../transparences/business-logic/models/domain-registry';
import {
  currentDate,
  jocelinUser,
  lucLoïcUser,
  nouvellTranspaEventId as nouvelleTranspaEventId,
  unDossierSiège,
  uneTransparence,
  uneTransparenceAvecProfilé,
  uneTransparenceAvecProfiléAvecRetourALaLigne,
  uneTransparenceParquet,
  uneTransparenceXlsxParquet,
  uneTransparenceXlsxSiège,
  unNomMagistrat,
  unXlsxProfilé,
  unXlsxProfiléAvecRetourALaLigne,
} from './import-transparence-xlsx.fixtures';
import { ImportTransparenceXlsxUseCase } from './import-transparence-xlsx.use-case';

describe('Import Transparence XLSX Use Case', () => {
  let transparenceRepository: FakeTransparenceRepository;
  let domainEventRepository: FakeDomainEventRepository;
  let userService: FakeUserService;

  beforeEach(() => {
    domainEventRepository = new FakeDomainEventRepository();
    transparenceRepository = new FakeTransparenceRepository();
    const uuidGenerator = new DeterministicUuidGenerator();
    uuidGenerator.nextUuids = [
      unDossierSiège.id,
      uneTransparence.id,
      nouvelleTranspaEventId,
    ];
    DomainRegistry.setUuidGenerator(uuidGenerator);
    const dateTimeProvider = new DeterministicDateProvider();
    dateTimeProvider.currentDate = currentDate;
    DomainRegistry.setDateTimeProvider(dateTimeProvider);

    userService = new FakeUserService();
    userService.addUsers(lucLoïcUser, jocelinUser);
  });

  it('enregistre un fichier XLSX Siège', async () => {
    await importerTransparenceXlsx(
      uneTransparenceXlsxSiège,
      uneTransparence.formation,
      uneTransparence.name,
      uneTransparence.dateEchéance,
      uneTransparence.dateTransparence,
      uneTransparence.datePriseDePosteCible,
      uneTransparence.dateClôtureDélaiObservation,
    );

    expect(transparenceRepository.getTransparences()).toEqual([
      uneTransparence,
    ]);
  });

  it('enregistre un fichier XLSX Parquet', async () => {
    await importerTransparenceXlsx(
      uneTransparenceXlsxParquet,
      uneTransparenceParquet.formation,
      uneTransparenceParquet.name,
      uneTransparenceParquet.dateEchéance,
      uneTransparenceParquet.dateTransparence,
      uneTransparenceParquet.datePriseDePosteCible,
      uneTransparenceParquet.dateClôtureDélaiObservation,
    );

    expect(transparenceRepository.getTransparences()).toEqual([
      uneTransparenceParquet,
    ]);
  });

  it.each`
    xlsx                               | transparence
    ${unXlsxProfilé}                   | ${uneTransparenceAvecProfilé}
    ${unXlsxProfiléAvecRetourALaLigne} | ${uneTransparenceAvecProfiléAvecRetourALaLigne}
  `(
    'extrait le grade du magistrat à partir du fichier XLSX',
    async ({ xlsx, transparence }) => {
      await importerTransparenceXlsx(
        xlsx,
        transparence.formation,
        transparence.name,
        transparence.dateEchéance,
        transparence.dateTransparence,
        uneTransparence.datePriseDePosteCible,
        transparence.dateClôtureDélaiObservation,
      );

      expect(transparenceRepository.getTransparences()).toEqual([transparence]);
    },
  );

  it("publie l'évènement Nouvelle transparence", async () => {
    await importerTransparenceXlsx(
      uneTransparenceXlsxSiège,
      uneTransparence.formation,
      uneTransparence.name,
      uneTransparence.dateEchéance,
      uneTransparence.dateTransparence,
      uneTransparence.datePriseDePosteCible,
      uneTransparence.dateClôtureDélaiObservation,
    );

    const event = domainEventRepository.events[0]!;
    expect(event.id).toEqual(nouvelleTranspaEventId);
    expect(event.type).toEqual(TransparenceXlsxImportéeEvent.name);
    expect(event.occurredOn).toEqual(currentDate);
    expect(event.payload).toEqual<TransparenceXlsxImportéeEventPayload>({
      transparenceId: uneTransparence.id,
      transparenceName: uneTransparence.name,
      formation: uneTransparence.formation,
      dateEchéance: uneTransparence.dateEchéance,
      dateTransparence: uneTransparence.dateTransparence,
      dateClôtureDélaiObservation: uneTransparence.dateClôtureDélaiObservation,
      nominationFiles: [
        {
          nominationFileId: unDossierSiège.id,
          content: {
            numeroDeDossier: unDossierSiège.content.numeroDeDossier,
            magistrat: unNomMagistrat,
            posteCible: unDossierSiège.content.posteCible,
            posteActuel: unDossierSiège.content.posteActuel,
            dateDeNaissance: unDossierSiège.content.dateDeNaissance,
            datePriseDeFonctionPosteActuel:
              unDossierSiège.content.datePriseDeFonctionPosteActuel,
            datePassageAuGrade: unDossierSiège.content.datePassageAuGrade,
            equivalenceOuAvancement:
              unDossierSiège.content.equivalenceOuAvancement,
            grade: unDossierSiège.content.grade,
            observers: unDossierSiège.content.observers,
            informationCarriere: unDossierSiège.content.informationCarriere,
            historique: unDossierSiège.content.historique,
            rank: unDossierSiège.content.rank,
            reporterIds: [lucLoïcUser.userId, jocelinUser.userId],
          },
        },
      ],
    });
  });

  const importerTransparenceXlsx = async (
    xlsxFile: File,
    formation: Magistrat.Formation,
    name: string,
    dateEchéance: DateOnlyJson,
    dateTransparence: DateOnlyJson,
    datePriseDePosteCible: DateOnlyJson | null,
    dateClôtureDélaiObservation: DateOnlyJson | null,
  ) =>
    new ImportTransparenceXlsxUseCase(
      new NullTransactionPerformer(),
      new TransparenceService(
        domainEventRepository,
        transparenceRepository,
        userService,
      ),
    ).execute(
      xlsxFile,
      formation,
      name,
      dateTransparence,
      dateEchéance,
      datePriseDePosteCible,
      dateClôtureDélaiObservation,
    );
});
