import { Magistrat } from 'shared-models';
import { AffectationRapporteursCréeEventPayload } from 'src/nominations-context/business-logic/models/events/affectation-rapporteurs-crée.event';
import { TypeDeSaisine } from 'src/nominations-context/business-logic/models/type-de-saisine';
import { getDependencies, unRapporteur } from '../test-dependencies';
import { CreateReportCommand } from '../use-cases/report-creation/create-report.use-case';
import { AffectationRapporteursCrééeSubscriber } from './affectation-rapporteurs-crée.subscriber';

describe('Affectation Rapporteurs Créée Subscriber', () => {
  let dependencies: ReturnType<typeof getDependencies>;

  beforeEach(() => {
    dependencies = getDependencies();
    dependencies.stubUserService.user = unRapporteur;
    dependencies.createReportUseCase.execute = jest.fn();
  });

  it('crée un rapport pour un dossier affecté', async () => {
    new AffectationRapporteursCrééeSubscriber(
      dependencies.createReportUseCase,
    ).handle(payload);
    expect(dependencies.createReportUseCase.execute).toHaveBeenCalledWith(
      uneCommande,
    );
  });
});

const payload: AffectationRapporteursCréeEventPayload = {
  id: 'affectation-id',
  sessionId: 'session-id',
  typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS,
  formation: Magistrat.Formation.PARQUET,
  affectationsDossiersDeNominations: [
    {
      dossierDeNominationId: 'dossier-id',
      rapporteurIds: ['rapporteur-id'],
    },
  ],
};

const uneCommande = CreateReportCommand.create({
  dossierDeNominationId: 'dossier-id',
  sessionId: 'session-id',
  formation: Magistrat.Formation.PARQUET,
  rapporteurId: 'rapporteur-id',
});
