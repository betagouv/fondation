import { Magistrat, RulesBuilder, Transparency } from 'shared-models';
import { GdsNewTransparenceImportedEventPayload } from 'src/data-administration-context/transparence-tsv/business-logic/models/events/gds-transparence-imported.event';
import {
  allRulesMapV1,
  ManagementRule,
  QualitativeRule,
  StatutoryRule,
} from 'src/data-administration-context/transparence-tsv/business-logic/models/rules';
import { getDependencies } from 'src/nominations-context/tests-dependencies';
import { ImportNouvelleTransparenceCommand } from '../use-cases/import-nouvelle-transparence/Import-nouvelle-transparence.command';
import { GdsNouvellesTransparencesImportéesSubscriber } from './gds-nouvelles-transparences-importées.subscriber';

describe('GDS nouvelles transparences importées sbscriber', () => {
  let dependencies: ReturnType<typeof getDependencies>;

  beforeEach(() => {
    dependencies = getDependencies();
    dependencies.importNouvelleTransparenceUseCase.execute = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('appelle le use case', async () => {
    await listenEvent();
    expectNouvelleTransparenceCalledWith(uneTransparence);
  });

  const listenEvent = () =>
    new GdsNouvellesTransparencesImportéesSubscriber(
      dependencies.importNouvelleTransparenceUseCase,
    ).handle(firstPayload);

  const expectNouvelleTransparenceCalledWith = (transparence: Transparency) => {
    expect(
      dependencies.importNouvelleTransparenceUseCase.execute,
    ).toHaveBeenCalledOnce();
    expect(
      dependencies.importNouvelleTransparenceUseCase.execute,
    ).toHaveBeenCalledWith(
      new ImportNouvelleTransparenceCommand(
        uneTransparenceId,
        transparence,
        uneFormation,
        [dossierDeNominationPayload],
      ),
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
const uneTransparenceId = 'une-transparence-id';
const uneTransparence = Transparency.AUTOMNE_2024;
const uneFormation = Magistrat.Formation.SIEGE;

const dossierDeNominationPayload: GdsNewTransparenceImportedEventPayload['nominationFiles'][number] =
  {
    nominationFileId: 'nomination-file-id',
    content: {
      transparency: uneTransparence,
      formation: uneFormation,
      biography: 'biography',
      birthDate: {
        day: 1,
        month: 1,
        year: 2000,
      },
      currentPosition: 'currentPosition',
      targettedPosition: 'targettedPosition',
      dueDate: {
        day: 1,
        month: 1,
        year: 2000,
      },
      folderNumber: 1,
      grade: Magistrat.Grade.I,
      name: 'name',
      observers: [],
      rank: 'rank',
      reporterIds: [lucLoïcReporterId],
      rules: new PayloadRules().build(),
    },
  };
const firstPayload: GdsNewTransparenceImportedEventPayload = {
  transparenceId: uneTransparenceId,
  transparenceName: uneTransparence,
  formation: uneFormation,
  nominationFiles: [dossierDeNominationPayload],
};
