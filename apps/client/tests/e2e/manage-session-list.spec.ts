import { expect, test } from '../fixtures';

test.describe('Gérer une liste de sessions', () => {
  test.describe('Soit 2 sessions', () => {
    let transparence1: string;
    let transparence2: string;

    test.beforeEach(async ({ app }) => {
      if (transparence1 && transparence2) {
        return;
      }

      transparence1 = `Transparence 1 - ${crypto.randomUUID()}`;
      transparence2 = `Transparence 2 - ${crypto.randomUUID()}`;

      const lolfiIngestionsForm = await app.pages.admin.goto('newIngestion');
      await lolfiIngestionsForm.upload({
        sessions: [
          {
            name: transparence1,
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
            ],
          },
          {
            name: transparence2,
            createdAt: '01/02/2026',
            candidates: [
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

    test(`les sessions doivent être triées par ordre décroissant de date de publication par défaut`, async ({
      app,
    }) => {
      // Quand je visualise la liste des sessions
      await app.pages.manageSessions.goto();
      await app.pages.manageSessions.sessionRow(transparence1).waitFor();

      const texts = await app.page.getByRole('row').allInnerTexts();

      const transparence1Index = texts.findIndex((txt) => txt.includes(transparence1));
      const transparence2Index = texts.findIndex((txt) => txt.includes(transparence2));

      // Alors la session "Transparence 1" est avant la session "Transparence 2"
      expect(transparence1Index).toBeLessThan(transparence2Index);
    });

    test(`les sessions sont triables`, async ({ app }) => {
      // Quand je visualise la liste des sessions
      await app.pages.manageSessions.goto();
      await app.pages.manageSessions.sessionRow(transparence1).waitFor();

      // Et que je trie par "Date de publication"
      await app.pages.manageSessions.dateHeader.click();
      await expect(app.pages.manageSessions.dateHeader).toHaveAttribute('aria-sort', 'ascending');
      await app.page.waitForLoadState('networkidle');

      const texts = await app.page.getByRole('row').allInnerTexts();

      const transparence1Index = texts.findIndex((txt) => txt.includes(transparence1));
      const transparence2Index = texts.findIndex((txt) => txt.includes(transparence2));

      // Alors la session "Transparence 2" est avant la session "Transparence 1"
      expect(transparence2Index).toBeLessThan(transparence1Index);
    });
  });
});
