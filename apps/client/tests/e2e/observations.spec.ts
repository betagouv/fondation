import { test } from '../fixtures';

test.describe('observations', () => {
  test.describe('soit une transparence', () => {
    let sessionName: string;

    let magistrats: {
      michelFoucault: { firstName: string; lastName: string };
      marieCurie: { firstName: string; lastName: string };
    };

    test.beforeEach(async ({ http, app }) => {
      test.setTimeout(5_000);
      sessionName = `Transparence annuelle ${crypto.randomUUID()}`;
      const { id: sessionId } = await http.sessions.createSession({
        name: sessionName,
        date: new Date('2026-03-01'),
        observationClosingDate: new Date('2026-03-10'),
        formation: 'SIEGE'
      });

      await http.sessions.attachNominationFiles({
        sessionId,
        // prettier-ignore
        files: [
          { fileNumber: 1, name: 'Antoine DUPOND', currentPosition: 'Président TJ  LYON', grade: 'G2', targetedPosition: 'Président TJ  CAEN', targetedGrade: 'G2' },
          { fileNumber: 2, name: 'Sarah CLERC', currentPosition: 'Président TJ  ANNECY', grade: 'G2', targetedPosition: 'Président TJ  ROUEN', targetedGrade: 'G2' },
        ]
      });

      magistrats = {
        michelFoucault: { firstName: `Michel ${crypto.randomUUID()}`, lastName: 'FOUCAULT' },
        marieCurie: { firstName: `Marie ${crypto.randomUUID()}`, lastName: 'CURIE' }
      };

      await http.data.createMagistrats([
        {
          civilite: 'M.',
          usedName: null,
          marriedName: null,
          ...magistrats.michelFoucault
        },
        {
          civilite: 'MME',
          usedName: null,
          marriedName: null,
          ...magistrats.marieCurie
        }
      ]);

      await app.pages.manageSessions.goto();
      await app.pages.manageSessions.sessionRow(sessionName).click();
      await app.page.getByRole('heading', { name: sessionName }).waitFor();
      await test.expect(app.page.getByRole('cell', { name: 'Chargement...' })).toBeHidden();
    });

    test('je crée une observation sur un dossier', async ({ app }) => {
      // Quand je bascule en édition
      await app.pages.session.switchToEditModeButton.click();
      // Et que j'ouvre la boite de dialogue d'ajout d'une observation
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
      // Et que je ferme la boite de dialogue
      await modal.closeButton.click();
      await test.expect(modal.dialog).toBeHidden();

      // Et que je bascule en mode lecture
      await app.pages.session.switchToReadModeButton.click();

      // Alors la colonne "Observant(s)" doit contenir "Michel Foucault"
      const row = app.pages.session.sessionRow({ number: 1 });
      await test.expect(row.getByRole('link', { name: magistrats.michelFoucault.firstName })).toBeVisible();
    });
  });
});
