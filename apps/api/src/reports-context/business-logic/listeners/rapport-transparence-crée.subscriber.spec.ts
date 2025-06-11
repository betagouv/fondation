import { Magistrat } from 'shared-models';
import { RapportTransparenceCrééEventPayload } from '../models/events/rapport-transparence-créé.event';
import {
  CréerAnalyseCommand,
  CréerAnalyseUseCase,
} from '../use-cases/création-analyse/créer-analyse.use-case';
import { RapportTransparenceCrééSubscriber } from './rapport-transparence-crée.subscriber';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';

describe('Rapport transparence créé subscriber', () => {
  let créerAnalyseUseCase: CréerAnalyseUseCase;

  beforeEach(() => {
    créerAnalyseUseCase = new CréerAnalyseUseCase(
      new NullTransactionPerformer(),
    );
    créerAnalyseUseCase.execute = jest.fn();
  });

  it("appelle le use case de création d'analyse avec l'id du rapport", async () => {
    const subscriber = new RapportTransparenceCrééSubscriber(
      créerAnalyseUseCase,
    );

    await subscriber.handle(unPayloadDeRapportCréé);

    expect(créerAnalyseUseCase.execute).toHaveBeenCalledTimes(1);
    expect(créerAnalyseUseCase.execute).toHaveBeenCalledWith(
      new CréerAnalyseCommand(unRapportId),
    );
  });
});

const unRapportId = 'un-rapport-id';
const unDossierId = 'un-dossier-id';
const uneSessionId = 'une-session-id';
const unReporterId = 'un-reporter-id';
const uneFormation = Magistrat.Formation.SIEGE;

const unPayloadDeRapportCréé: RapportTransparenceCrééEventPayload = {
  id: unRapportId,
  createdAt: new Date(),
  dossierDeNominationId: unDossierId,
  sessionId: uneSessionId,
  reporterId: unReporterId,
  formation: uneFormation,
};
