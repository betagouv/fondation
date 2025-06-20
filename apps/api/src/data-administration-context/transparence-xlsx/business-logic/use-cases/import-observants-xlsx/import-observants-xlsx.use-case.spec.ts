import {
  transparenceObservantsModifiésEventId as transparenceXlsxObservantsModifiésEventId,
  unDossierSiègeAvecObservants,
  uneTransparenceAvecObservants,
  uneTransparenceSansObservants,
  uneTransparenceXlsxSiègeAvecObservants,
} from '../fixtures';
import { TestDependencies } from '../test-setup';

describe('Import Transparence XLSX Use Case - Observants', () => {
  let deps: TestDependencies;

  beforeEach(() => {
    deps = new TestDependencies();
    deps.givenUneTransparence();

    deps.uuidGenerator.nextUuids = [transparenceXlsxObservantsModifiésEventId];
  });

  it('ajoute les observants à une transparence existante', async () => {
    await deps.importerObservantsXlsx(
      uneTransparenceXlsxSiègeAvecObservants,
      uneTransparenceSansObservants.formation,
      uneTransparenceSansObservants.name,
      uneTransparenceSansObservants.dateEchéance,
    );

    deps.expectTransparence(uneTransparenceAvecObservants);
  });

  it("publie l'évènement Observants d'une transparence modifiés", async () => {
    await deps.importerObservantsXlsx(
      uneTransparenceXlsxSiègeAvecObservants,
      uneTransparenceSansObservants.formation,
      uneTransparenceSansObservants.name,
      uneTransparenceSansObservants.dateEchéance,
    );

    deps.expectTransparenceXlsxObservantsModifiésEvent(
      transparenceXlsxObservantsModifiésEventId,
      uneTransparenceAvecObservants,
      unDossierSiègeAvecObservants,
    );
  });
});
