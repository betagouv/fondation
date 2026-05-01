import { faker } from '@faker-js/faker/locale/fr';
import { test } from '../fixtures';

test.describe('Affectations', () => {
  test.describe('soit une transparence', () => {
    let sessionName: string;
    test.beforeEach(async ({ http }) => {
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
    });

    test('quand je publie la transparence sans affectation, elle apparaît auprès des membres', async ({
      app,
      newMemberApp
    }) => {
      // Et un membre du siège
      const firstName = faker.person.firstName() + ` ${crypto.randomUUID()}`;
      const lastName = faker.person.lastName();
      const memberApp = await newMemberApp({ role: 'MEMBRE_DU_SIEGE', firstName, lastName });

      await app.pages.manageSessions.goto();
      await app.pages.manageSessions.sessionRow(sessionName).click();
      await app.pages.session.waitFor(sessionName);

      // Quand je publie les affectations
      await app.pages.session.publishAffectationsButton.click();

      // Et que je bascule sur la vue du membre
      await memberApp.page.reload();

      // Alors la session "Transparence annuelle" apparaît dans toutes les sessions
      await test.expect(memberApp.pages.home.nonAffectedSessionLink(sessionName)).toBeVisible();
    });

    test("quand j'affecte la transparence au membre, elle apparait dans ses sessions", async ({
      app,
      newMemberApp
    }) => {
      test.setTimeout(10_000);

      // Et un membre du siège
      const firstName = faker.person.firstName() + ` ${crypto.randomUUID()}`;
      const lastName = faker.person.lastName();
      const memberApp = await newMemberApp({ role: 'MEMBRE_DU_SIEGE', firstName, lastName });

      // Quand je bascule en édition
      await app.pages.manageSessions.goto();
      await app.pages.manageSessions.sessionRow(sessionName).click();
      await app.pages.session.waitFor(sessionName);
      await test.expect(app.page.getByRole('cell', { name: 'Chargement...' })).toBeHidden();

      const page = app.pages.session;

      // Et que je sélectionne le member pour le dossier 1
      await page.switchToEditModeButton.click();
      await page.sessionRow({ number: 1 }).locator(page.selectReporterButton).click();

      await page.searchReporterInput.fill(firstName);
      await app.page
        .getByRole('checkbox', { name: `${lastName} ${firstName}` })
        .first()
        .click({ force: true });

      // Et que je sauvegarde l'affectation
      await page.saveAffectationsButton.click();
      await test.expect(page.saveAffectationsButton).toBeDisabled();

      await page
        .sessionRow({ number: 1 })
        .locator(app.page.getByRole('cell', { name: `${firstName} ${lastName}` }))
        .waitFor({ timeout: 800 });

      // Et que je publie les affectations
      await page.publishAffectationsButton.click();
      await test.expect(app.page.getByRole('alert')).toBeVisible();

      // Et que je bascule sur la vue du membre
      await memberApp.page.reload();

      // Alors la session "Transparence annuelle" apparaît dans les sessions affectées
      await test.expect(memberApp.pages.home.affectedSessionLink(sessionName)).toBeVisible();
    });
  });
});
