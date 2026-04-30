import { expect, test } from '../fixtures';

test.describe('Gérer une liste de sessions', () => {
  test(`les sessions doivent être triées par ordre décroissant`, async ({ app, http }) => {
    const name1 = `Transparence 1 - ${crypto.randomUUID()}`;
    const name2 = `Transparence 2 - ${crypto.randomUUID()}`;

    // prettier-ignore
    {
      // Soit une session "Transparence 1" en date du "01/03/2026"
      await http.sessions.createSession({ name: name1, date: new Date('2026-03-01'), formation: 'PARQUET', observationClosingDate: new Date('2026-03-10') });
      // Et une session "Transparence 1" en date du "01/02/2026"
      await http.sessions.createSession({ name: name2, date: new Date('2026-02-01'), formation: 'PARQUET', observationClosingDate: new Date('2026-02-10') });
    }

    // Quand je visualise la liste des sessions
    await app.pages.manageSessions.goto();
    await app.pages.manageSessions.sessionRow(name1).waitFor();

    const texts = await app.page.getByRole('row').allInnerTexts();

    const name1Index = texts.findIndex((txt) => txt.includes(name1));
    const name2Index = texts.findIndex((txt) => txt.includes(name2));

    // Alors la session "Transparence 1" est avant la session "Transparence 2"
    expect(name1Index).toBeLessThan(name2Index);
  });

  test.describe('Soit 2 sessions', () => {
    let name1: string;
    let name2: string;

    test.beforeEach(async ({ http }) => {
      name1 = `Transparence 1 - ${crypto.randomUUID()}`;
      name2 = `Transparence 2 - ${crypto.randomUUID()}`;

      // prettier-ignore
      {
        // Soit une session "Transparence 1" en date du "01/03/2026"
        await http.sessions.createSession({ name: name1, date: new Date('2026-03-01'), formation: 'PARQUET', observationClosingDate: new Date('2026-03-10') });
        // Et une session "Transparence 1" en date du "01/02/2026"
        await http.sessions.createSession({ name: name2, date: new Date('2026-02-01'), formation: 'PARQUET', observationClosingDate: new Date('2026-02-10') });
      }
    });

    test(`les sessions sont triables`, async ({ app }) => {
      // Quand je visualise la liste des sessions
      await app.pages.manageSessions.goto();
      await app.pages.manageSessions.sessionRow(name1).waitFor();

      // Et que je trie par "Date de publication"
      await app.pages.manageSessions.dateHeader.click();
      await expect(app.pages.manageSessions.dateHeader).toHaveAttribute('aria-sort', 'ascending');

      // Et que je trie par "Date de publication"
      await app.pages.manageSessions.dateHeader.click();
      await expect(app.pages.manageSessions.dateHeader).toHaveAttribute('aria-sort', 'descending');

      const texts = await app.page.getByRole('row').allInnerTexts();

      const name1Index = texts.findIndex((txt) => txt.includes(name1));
      const name2Index = texts.findIndex((txt) => txt.includes(name2));

      // Alors la session "Transparence 2" est avant la session "Transparence 1"
      expect(name2Index).toBeLessThan(name1Index);
    });
  });
});
