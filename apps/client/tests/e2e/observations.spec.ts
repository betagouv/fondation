import { test } from '../fixtures';

test.describe('observations', () => {
  test.describe.serial('soit une transparence', () => {
    let sessionName: string;

    let magistrats: {
      michelFoucault: { firstName: string; lastName: string };
      marieCurie: { firstName: string; lastName: string };
    };

    test.setTimeout(10_000);
    test.beforeEach(async ({ app }) => {
      if (sessionName && magistrats) {
        await app.pages.manageSessions.goto();
        await app.pages.manageSessions.sessionRow(sessionName).click();
        await test.expect(app.page.getByRole('heading', { name: sessionName })).toBeVisible();
        await test.expect(app.page.getByRole('cell', { name: 'chargement...' })).toBeHidden();

        return;
      }

      magistrats = {
        michelFoucault: { firstName: `Michel ${crypto.randomUUID()}`, lastName: 'FOUCAULT' },
        marieCurie: { firstName: `Marie ${crypto.randomUUID()}`, lastName: 'CURIE' },
      };

      sessionName = `Transparence annuelle ${crypto.randomUUID()}`;
      const lolfiIngestionsForm = await app.pages.admin.goto('newIngestion');
      await lolfiIngestionsForm.upload({
        sessions: [
          {
            name: sessionName,
            createdAt: '01/03/2026',
            candidates: [
              {
                firstName: 'antoine',
                lastName: 'dupond',
                position: {
                  function: { id: 'P', label: 'président', formation: 'SIEGE', addition: 'du {codejur}' },
                  jurisdiction: { id: 'TJ  LYON' },
                  grade: 'G2',
                },
                targetPosition: {
                  function: { id: 'P', label: 'président', formation: 'SIEGE', addition: 'du {codejur}' },
                  jurisdiction: { id: 'TJ  CAEN' },
                  grade: 'G2',
                },
              },
              {
                firstName: 'sarah',
                lastName: 'clerc',
                position: {
                  function: { id: 'P', label: 'président', formation: 'SIEGE', addition: 'du {codejur}' },
                  jurisdiction: { id: 'TJ  ANNECY' },
                  grade: 'G2',
                },
                targetPosition: {
                  function: { id: 'P', label: 'président', formation: 'SIEGE', addition: 'du {codejur}' },
                  jurisdiction: { id: 'TJ  ROUEN:' },
                  grade: 'G2',
                },
              },
            ],
          },
          {
            name: `__UNUSED ${crypto.randomUUID()}`,
            createdAt: '01/02/2026',
            candidates: [
              {
                ...magistrats.michelFoucault,

                position: {
                  function: { id: 'P', formation: 'SIEGE', label: 'président' },
                  jurisdiction: { id: 'TJ  STRASBOURG' },
                  grade: 'G2',
                },
                targetPosition: {
                  function: { id: 'P', formation: 'SIEGE', label: 'président' },
                  jurisdiction: { id: 'TJ  NANCY' },
                  grade: 'G2',
                },
              },
              {
                ...magistrats.marieCurie,

                position: {
                  function: { id: 'P', formation: 'SIEGE', label: 'président' },
                  jurisdiction: { id: 'TJ  RIOM' },
                  grade: 'G2',
                },
                targetPosition: {
                  function: { id: 'P', formation: 'SIEGE', label: 'président' },
                  jurisdiction: { id: 'TJ  MONTLUCON' },
                  grade: 'G2',
                },
              },
            ],
          },
        ],
      });

      await app.pages.manageSessions.goto();
      await app.pages.manageSessions.sessionRow(sessionName).click();
      await app.page.getByRole('heading', { name: sessionName }).waitFor();
      await test.expect(app.page.getByRole('cell', { name: 'Chargement...' })).toBeHidden();

      // Quand j'ouvre la boite de dialogue d'ajout d'une observation
      const modal = await app.pages.session.openObservationModal({ number: 1 });

      // Et que je saisis "01/05/2026" pour la date
      await modal.fillDate(new Date());
      // Et que je saisis "Michel Foucault" pour le magistrat
      await modal.searchMagistrat(magistrats.michelFoucault.firstName);

      // Et que je sélectionne "Michel Foucault" dans les propositions
      await modal.magistratsListbox
        .locator(modal.magistratsOption(magistrats.michelFoucault.firstName))
        .click();
      // Alors le magistrat sélectionné est "Michel Foucault"
      await test.expect(modal.magistratsSelectedButton(magistrats.michelFoucault.firstName)).toBeVisible();

      // Quand je clique sur "Sauvegarder"
      await modal.saveButton.click();
      // Et que je ferme la boite de dialogue puis le panneau
      await modal.closeButton.click();
      await modal.dialog.waitFor({ state: 'hidden' });
      await app.pages.session.closeMagistratDetails();
    });

    test('je crée une observation sur un dossier', async ({ app }) => {
      // Alors la colonne "Observant(s)" doit contenir "Michel Foucault"
      const row = app.pages.session.sessionRow({ number: 1 });
      await test.expect(row.getByRole('link', { name: magistrats.michelFoucault.firstName })).toBeVisible();
    });

    test("j'édite une observation", async ({ app }) => {
      await app.page.reload();
      await test.expect(app.page.getByRole('heading', { name: sessionName })).toBeVisible();
      await test.expect(app.page.getByRole('cell', { name: 'Chargement...' })).toBeHidden();

      const modal = await app.pages.session.openObservationModal({ number: 1 }, 'edit');
      await modal.fillHistory('Mise à jour');

      await modal.saveButton.click();
      await test.expect(modal.saveButton).toBeHidden();
      await modal.closeButton.click();

      const modalWithEdition = await app.pages.session.openObservationModal({ number: 1 }, 'edit');

      await test.expect(modalWithEdition.inputHistory).toHaveValue(/Mise à jour/);
    });
  });
});
