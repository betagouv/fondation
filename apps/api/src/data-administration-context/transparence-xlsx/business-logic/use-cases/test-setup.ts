import { DateOnlyJson, Magistrat } from 'shared-models';
import { TransparenceService } from 'src/data-administration-context/transparence-xlsx/business-logic/services/transparence.service';
import { FakeTransparenceRepository } from 'src/data-administration-context/transparences/adapters/secondary/gateways/repositories/fake-transparence.repository';
import { FakeUserService } from 'src/data-administration-context/transparences/adapters/secondary/gateways/services/fake-user.service';
import { DeterministicDateProvider } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-date-provider';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-uuid-generator';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { FakeDomainEventRepository } from 'src/shared-kernel/adapters/secondary/gateways/repositories/fake-domain-event-repository';
import { DomainRegistry } from '../../../transparences/business-logic/models/domain-registry';
import {
  TransparenceXlsxImportéeEvent,
  TransparenceXlsxImportéeEventPayload,
} from '../models/events/transparence-xlsx-importée.event';
import { NominationFileModelSnapshot } from '../models/nomination-file';
import { TransparenceSnapshot } from '../models/transparence';
import {
  currentDate,
  jocelinUser,
  lucLoïcUser,
  uneTransparenceSansObservants,
  unNomMagistrat,
} from './fixtures';
import { ImportTransparenceXlsxUseCase } from './import-transparence-xlsx/import-transparence-xlsx.use-case';
import { File } from 'buffer';
import {
  TransparenceXlsxObservantsImportésEvent,
  TransparenceXlsxObservantsImportésEventPayload,
} from '../models/events/transparence-xlsx-observants-importés.event';
import { ImportObservantsXlsxUseCase } from './import-observants-xlsx/import-observants-xlsx.use-case';

export class TestDependencies {
  readonly transparenceRepository: FakeTransparenceRepository;
  readonly domainEventRepository: FakeDomainEventRepository;
  readonly userService: FakeUserService;
  readonly uuidGenerator: DeterministicUuidGenerator;

  constructor() {
    this.domainEventRepository = new FakeDomainEventRepository();
    this.transparenceRepository = new FakeTransparenceRepository();
    this.uuidGenerator = new DeterministicUuidGenerator();

    DomainRegistry.setUuidGenerator(this.uuidGenerator);
    const dateTimeProvider = new DeterministicDateProvider();
    dateTimeProvider.currentDate = currentDate;
    DomainRegistry.setDateTimeProvider(dateTimeProvider);

    this.userService = new FakeUserService();
    this.userService.addUsers(lucLoïcUser, jocelinUser);
  }

  givenUneTransparence() {
    this.transparenceRepository.addTransparence(uneTransparenceSansObservants);
  }

  async importerTransparenceXlsx(
    xlsxFile: File,
    formation: Magistrat.Formation,
    name: string,
    dateEchéance: DateOnlyJson | null,
    dateTransparence: DateOnlyJson,
    datePriseDePosteCible: DateOnlyJson | null,
    dateClôtureDélaiObservation: DateOnlyJson,
  ) {
    return new ImportTransparenceXlsxUseCase(
      new NullTransactionPerformer(),
      new TransparenceService(
        this.domainEventRepository,
        this.transparenceRepository,
        this.userService,
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
  }

  async importerObservantsXlsx(
    xlsxFile: File,
    formation: Magistrat.Formation,
    name: string,
    dateTransparence: DateOnlyJson,
  ) {
    return new ImportObservantsXlsxUseCase(
      new NullTransactionPerformer(),
      new TransparenceService(
        this.domainEventRepository,
        this.transparenceRepository,
        this.userService,
      ),
    ).execute(xlsxFile, formation, name, dateTransparence);
  }

  expectTransparence(...transparences: TransparenceSnapshot[]) {
    expect(this.transparenceRepository.getTransparences()).toEqual(
      transparences,
    );
  }

  expectTransparenceXlsxImportéeEvent(
    nouvelleTranspaEventId: string,
    uneTransparence: TransparenceSnapshot,
    unDossierSiège: NominationFileModelSnapshot,
    reporterIds: string[],
  ) {
    const event = this.domainEventRepository.events[0]!;
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
            reporterIds: reporterIds,
          },
        },
      ],
    });
  }

  expectTransparenceXlsxObservantsModifiésEvent(
    eventId: string,
    transparence: TransparenceSnapshot,
    dossier: NominationFileModelSnapshot,
  ) {
    const event = this.domainEventRepository.events[0]!;

    expect(event.id).toEqual(eventId);
    expect(event.type).toEqual(TransparenceXlsxObservantsImportésEvent.name);
    expect(event.occurredOn).toEqual(currentDate);
    expect(
      event.payload,
    ).toEqual<TransparenceXlsxObservantsImportésEventPayload>({
      transparenceId: transparence.id,
      dossiersDeNominations: [
        {
          dossierId: dossier.id,
          observants: dossier.content.observers,
        },
      ],
    });
  }
}
