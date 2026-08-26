import { faker } from '@faker-js/faker/locale/fr';

import { test } from '../fixtures';

test.describe('Affectations', () => {
  test.describe('soit une transparence', () => {
    let sessionName: string;
    test.beforeEach(async ({ app }) => {
      if (sessionName) return;

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
        ],
      });
    });

    test('quand je publie la transparence sans affectation, elle apparaît auprès des membres', async ({
      app,
      newMemberApp,
    }) => {
      // Et un membre du siège
      const firstName = faker.person.firstName() + crypto.randomUUID().replaceAll('-', '');
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
      newMemberApp,
    }) => {
      test.setTimeout(10_000);

      // Et un membre du siège
      const firstName = faker.person.firstName() + crypto.randomUUID().replaceAll('-', '');
      const lastName = faker.person.lastName();
      const memberApp = await newMemberApp({ role: 'MEMBRE_DU_SIEGE', firstName, lastName });

      // Quand je bascule en édition
      await app.pages.manageSessions.goto();
      await app.pages.manageSessions.sessionRow(sessionName).click();
      await app.pages.session.waitFor(sessionName);
      await test.expect(app.page.getByRole('cell', { name: 'Chargement...' })).toBeHidden();

      const page = app.pages.session;

      // Et que j'affecte le membre au dossier 1 depuis son panneau
      await page.editAffectation({ number: 1 }, { reporters: [new RegExp(`${firstName} ${lastName}`, 'i')] });

      await page
        .sessionRow({ number: 1 })
        .locator(
          app.page.getByRole('cell', {
            name: `${firstName[0].toUpperCase()}${lastName[0].toUpperCase()}`,
            exact: true,
          }),
        )
        .waitFor({ timeout: 800 });

      // Et que je publie les affectations
      await page.publishAffectationsButton.click();
      await test.expect(page.publishedAffectationsToast).toBeVisible();

      // Et que je bascule sur la vue du membre
      await memberApp.page.reload();

      // Alors la session "Transparence annuelle" apparaît dans les sessions affectées
      await test.expect(memberApp.pages.home.affectedSessionLink(sessionName)).toBeVisible();
    });
  });
});
