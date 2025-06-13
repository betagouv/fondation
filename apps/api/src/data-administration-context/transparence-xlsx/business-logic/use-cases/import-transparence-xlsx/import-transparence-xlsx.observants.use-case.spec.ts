import {
  transparenceObservantsModifiésEventId as transparenceXlsxObservantsModifiésEventId,
  unDossierSiègeAvecObservants,
  uneTransparenceAvecObservants,
  uneTransparenceSansObservants,
  uneTransparenceXlsxSiègeAvecObservants,
} from './import-transparence-xlsx.fixtures';
import { TestDependencies } from './import-transparence-xlsx.test-setup';

describe('Import Transparence XLSX Use Case - Observants', () => {
  let deps: TestDependencies;

  beforeEach(() => {
    deps = new TestDependencies();
    deps.givenUneTransparence();

    deps.uuidGenerator.nextUuids = [transparenceXlsxObservantsModifiésEventId];
  });

  it('ajoute les observants à une transparence existante', async () => {
    await deps.importerTransparenceXlsx(
      uneTransparenceXlsxSiègeAvecObservants,
      uneTransparenceSansObservants.formation,
      uneTransparenceSansObservants.name,
      uneTransparenceSansObservants.dateEchéance,
      uneTransparenceSansObservants.dateTransparence,
      uneTransparenceSansObservants.datePriseDePosteCible,
      uneTransparenceSansObservants.dateClôtureDélaiObservation,
    );

    deps.expectTransparence(uneTransparenceAvecObservants);
  });

  it("publie l'évènement Observants d'une transparence modifiés", async () => {
    await deps.importerTransparenceXlsx(
      uneTransparenceXlsxSiègeAvecObservants,
      uneTransparenceSansObservants.formation,
      uneTransparenceSansObservants.name,
      uneTransparenceSansObservants.dateEchéance,
      uneTransparenceSansObservants.dateTransparence,
      uneTransparenceSansObservants.datePriseDePosteCible,
      uneTransparenceSansObservants.dateClôtureDélaiObservation,
    );

    deps.expectTransparenceXlsxObservantsModifiésEvent(
      transparenceXlsxObservantsModifiésEventId,
      uneTransparenceAvecObservants,
      unDossierSiègeAvecObservants,
    );
  });
});
