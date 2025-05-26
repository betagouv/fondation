import { Magistrat, RulesBuilder, Transparency } from 'shared-models';
import { GdsTransparenceNominationFilesAddedEventPayload } from 'src/data-administration-context/transparence-tsv/business-logic/models/events/gds-transparence-nomination-files-added.event';
import {
  allRulesMapV1,
  ManagementRule,
  QualitativeRule,
  StatutoryRule,
} from 'src/data-administration-context/transparence-tsv/business-logic/models/rules';
import { getDependencies } from 'src/nominations-context/tests-dependencies';
import { ImportNouveauxDossiersTransparenceCommand } from '../use-cases/import-nouveaux-dossiers-transparence/import-nouveaux-dossiers-transparence.command';
import { GdsTransparenceNouveauxDossiersSubscriber } from './gds-transparence-nouveaux-dossiers.subscriber';

describe('GDS transparence nouveaux dossiers sbscriber', () => {
  let dependencies: ReturnType<typeof getDependencies>;

  beforeEach(() => {
    dependencies = getDependencies();
    dependencies.importNouveauxDossiersTransparenceUseCase.execute = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('appelle le use case', async () => {
    await listenEvent();
    expectImportNouveauxDossiersUseCaseCalled();
  });

  const listenEvent = () =>
    new GdsTransparenceNouveauxDossiersSubscriber(
      dependencies.importNouveauxDossiersTransparenceUseCase,
    ).handle(payload);

  const expectImportNouveauxDossiersUseCaseCalled = () => {
    expect(
      dependencies.importNouveauxDossiersTransparenceUseCase.execute,
    ).toHaveBeenCalledExactlyOnceWith(
      ImportNouveauxDossiersTransparenceCommand.create({
        transparenceId: payload.transparenceId,
        nominationFiles: payload.nominationFiles,
      }),
    );
  };
});

class PayloadRules extends RulesBuilder<
  boolean,
  ManagementRule,
  StatutoryRule,
  QualitativeRule
> {
  constructor() {
    super(true, allRulesMapV1);
  }
}

const lucLoïcReporterId = 'luc-loic-reporter-id';
const uneTransparence = Transparency.AUTOMNE_2024;

const dossierDeNominationPayload: GdsTransparenceNominationFilesAddedEventPayload['nominationFiles'][number] =
  {
    nominationFileId: 'nouveau-dossier-id',
    content: {
      transparency: uneTransparence,
      biography: 'nouvelle biographie',
      birthDate: {
        day: 1,
        month: 1,
        year: 2000,
      },
      currentPosition: 'nouvelle position actuelle',
      targettedPosition: 'nouvelle position visée',
      dueDate: {
        day: 1,
        month: 1,
        year: 2000,
      },
      folderNumber: 2,
      formation: Magistrat.Formation.SIEGE,
      grade: Magistrat.Grade.II,
      name: 'nouveau nom',
      observers: [],
      rank: 'nouveau rang',
      reporterIds: [lucLoïcReporterId],
      rules: new PayloadRules().build(),
    },
  };

const payload: GdsTransparenceNominationFilesAddedEventPayload = {
  transparenceId: uneTransparence,
  transparenceName: uneTransparence,
  nominationFiles: [dossierDeNominationPayload],
};
