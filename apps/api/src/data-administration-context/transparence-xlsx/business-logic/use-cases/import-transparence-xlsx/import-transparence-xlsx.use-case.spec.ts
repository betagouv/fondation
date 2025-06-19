import { Magistrat } from 'shared-models';
import {
  jocelinUser,
  lucLoïcUser,
  nouvellTranspaEventId as nouvelleTranspaEventId,
  unDossierSiège,
  uneTransparence,
  uneTransparenceAvecProfilé,
  uneTransparenceAvecProfiléAvecRetourALaLigne,
  uneTransparenceXlsxInvalide,
  uneTransparenceXlsxSiège,
  unXlsxProfilé,
  unXlsxProfiléAvecRetourALaLigne,
} from '../fixtures';
import { TestDependencies } from '../test-setup';

describe('Import Transparence XLSX Use Case', () => {
  let deps: TestDependencies;

  beforeEach(() => {
    deps = new TestDependencies();

    deps.uuidGenerator.nextUuids = [
      unDossierSiège.id,
      uneTransparence.id,
      nouvelleTranspaEventId,
    ];
  });

  it("retourne les erreurs de validation d'un fichier XLSX", async () => {
    const validationErrorResp = await deps.importerTransparenceXlsx(
      uneTransparenceXlsxInvalide,
      Magistrat.Formation.SIEGE,
      'nom',
      null,
      {
        year: 2024,
        month: 10,
        day: 10,
      },
      null,
      {
        year: 2024,
        month: 10,
        day: 10,
      },
    );

    expect(validationErrorResp).toEqual({
      validationError: `Valeur invalide pour la colonne "numéro de dossier" : ABC à la ligne 1`,
    });

    deps.expectTransparence();
  });

  it('enregistre un fichier XLSX Siège', async () => {
    await deps.importerTransparenceXlsx(
      uneTransparenceXlsxSiège,
      uneTransparence.formation,
      uneTransparence.name,
      uneTransparence.dateEchéance,
      uneTransparence.dateTransparence,
      uneTransparence.datePriseDePosteCible,
      uneTransparence.dateClôtureDélaiObservation,
    );

    deps.expectTransparence(uneTransparence);
  });

  it.each`
    xlsx                               | transparence
    ${unXlsxProfilé}                   | ${uneTransparenceAvecProfilé}
    ${unXlsxProfiléAvecRetourALaLigne} | ${uneTransparenceAvecProfiléAvecRetourALaLigne}
  `(
    'extrait le grade du magistrat à partir du fichier XLSX',
    async ({ xlsx, transparence }) => {
      await deps.importerTransparenceXlsx(
        xlsx,
        transparence.formation,
        transparence.name,
        transparence.dateEchéance,
        transparence.dateTransparence,
        uneTransparence.datePriseDePosteCible,
        transparence.dateClôtureDélaiObservation,
      );

      deps.expectTransparence(transparence);
    },
  );

  it("publie l'évènement Nouvelle transparence", async () => {
    await deps.importerTransparenceXlsx(
      uneTransparenceXlsxSiège,
      uneTransparence.formation,
      uneTransparence.name,
      uneTransparence.dateEchéance,
      uneTransparence.dateTransparence,
      uneTransparence.datePriseDePosteCible,
      uneTransparence.dateClôtureDélaiObservation,
    );

    deps.expectTransparenceXlsxImportéeEvent(
      nouvelleTranspaEventId,
      uneTransparence,
      unDossierSiège,
      [lucLoïcUser.userId, jocelinUser.userId],
    );
  });
});
