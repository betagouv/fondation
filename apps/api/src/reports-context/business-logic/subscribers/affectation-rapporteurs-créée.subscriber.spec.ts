import { Magistrat } from 'shared-models';
import { AffectationRapporteursCréeEventPayload } from 'src/nominations-context/business-logic/models/events/affectation-rapporteurs-crée.event';
import { TypeDeSaisine } from 'shared-models';
import { getDependencies } from '../test-dependencies';
import { CreateReportCommand } from '../use-cases/report-creation/create-report.use-case';
import { AffectationRapporteursCrééeSubscriber } from './affectation-rapporteurs-créée.subscriber';

describe('Affectation Rapporteurs Créée Subscriber', () => {
  let dependencies: ReturnType<typeof getDependencies>;

  beforeEach(() => {
    dependencies = getDependencies();
    dependencies.createReportUseCase.execute = jest
      .fn()
      .mockImplementation(() => async () => void 0);
  });

  it('crée un rapport pour un dossier affecté', async () => {
    await subscribeAffectationRapporteursCréée();

    expectCreateReportNthCalledWith(1, dossier1Rapporteur1Commande);
    expectCreateReportNthCalledWith(2, dossier1Rapporteur2Commande);
    expectCreateReportNthCalledWith(3, dossier2Rapporteur1Commande);
  });

  const subscribeAffectationRapporteursCréée = () => {
    return new AffectationRapporteursCrééeSubscriber(
      dependencies.createReportUseCase,
      dependencies.nullTransactionPerformer,
    ).handle(payload);
  };

  const expectCreateReportNthCalledWith = (
    index: number,
    commande: CreateReportCommand,
  ) => {
    expect(dependencies.createReportUseCase.execute).toHaveBeenNthCalledWith(
      index,
      commande,
    );
  };
});

const payload: AffectationRapporteursCréeEventPayload = {
  id: 'affectation-id',
  sessionId: 'session-id',
  typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS,
  formation: Magistrat.Formation.PARQUET,
  affectationsDossiersDeNominations: [
    {
      dossierDeNominationId: 'dossier-id',
      rapporteurIds: ['rapporteur-id', 'second-rapporteur-id'],
    },
    {
      dossierDeNominationId: 'dossier-id-2',
      rapporteurIds: ['rapporteur-id'],
    },
  ],
};

const dossier1Rapporteur1Commande = CreateReportCommand.create({
  dossierDeNominationId: 'dossier-id',
  sessionId: 'session-id',
  formation: Magistrat.Formation.PARQUET,
  rapporteurId: 'rapporteur-id',
});
const dossier1Rapporteur2Commande = CreateReportCommand.create({
  dossierDeNominationId: 'dossier-id',
  sessionId: 'session-id',
  formation: Magistrat.Formation.PARQUET,
  rapporteurId: 'second-rapporteur-id',
});
const dossier2Rapporteur1Commande = CreateReportCommand.create({
  dossierDeNominationId: 'dossier-id-2',
  sessionId: 'session-id',
  formation: Magistrat.Formation.PARQUET,
  rapporteurId: 'rapporteur-id',
});
