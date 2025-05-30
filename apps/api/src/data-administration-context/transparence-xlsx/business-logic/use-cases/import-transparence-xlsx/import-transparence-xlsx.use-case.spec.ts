import { Magistrat } from 'shared-models';
import { TransparenceService } from 'src/data-administration-context/transparence-xlsx/business-logic/services/transparence.service';
import { FakeTransparenceRepository } from 'src/data-administration-context/transparences/adapters/secondary/gateways/repositories/fake-transparence.repository';
import { FakeUserService } from 'src/data-administration-context/transparences/adapters/secondary/gateways/services/fake-user.service';
import { DeterministicDateProvider } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-date-provider';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-uuid-generator';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { FakeDomainEventRepository } from 'src/shared-kernel/adapters/secondary/gateways/repositories/fake-domain-event-repository';
import { DomainEventRepository } from 'src/shared-kernel/business-logic/gateways/repositories/domain-event.repository';
import { DomainRegistry } from '../../../../transparences/business-logic/models/domain-registry';
import {
  currentDate,
  lucLoïcUser,
  unDossierSiège,
  uneTransparence,
  uneTransparenceAvecProfilé,
  uneTransparenceAvecProfiléAvecRetourALaLigne,
  uneTransparenceXlsx,
  unXlsxProfilé,
  unXlsxProfiléAvecRetourALaLigne,
} from './import-transparence-xlsx.fixtures';
import { ImportTransparenceXlsxUseCase } from './import-transparence-xlsx.use-case';

describe('Import Transparence XLSX Use Case', () => {
  let transparenceRepository: FakeTransparenceRepository;
  let domainEventRepository: DomainEventRepository;
  let userService: FakeUserService;

  beforeEach(() => {
    domainEventRepository = new FakeDomainEventRepository();
    transparenceRepository = new FakeTransparenceRepository();
    const uuidGenerator = new DeterministicUuidGenerator();
    uuidGenerator.nextUuids = [unDossierSiège.id, uneTransparence.id];
    DomainRegistry.setUuidGenerator(uuidGenerator);
    const dateTimeProvider = new DeterministicDateProvider();
    dateTimeProvider.currentDate = currentDate;
    DomainRegistry.setDateTimeProvider(dateTimeProvider);

    userService = new FakeUserService();
    userService.addUsers(lucLoïcUser);
  });

  it('enregistre un fichier XLSX', async () => {
    await importerTransparenceXlsx(
      uneTransparenceXlsx,
      uneTransparence.formation,
      uneTransparence.name,
    );

    expect(transparenceRepository.getTransparences()).toEqual([
      uneTransparence,
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
      );

      expect(transparenceRepository.getTransparences()).toEqual([transparence]);
    },
  );

  const importerTransparenceXlsx = async (
    xlsxFile: File,
    formation: Magistrat.Formation,
    name: string,
  ) =>
    new ImportTransparenceXlsxUseCase(
      new NullTransactionPerformer(),
      new TransparenceService(
        domainEventRepository,
        transparenceRepository,
        userService,
      ),
    ).execute(xlsxFile, formation, name);
});
