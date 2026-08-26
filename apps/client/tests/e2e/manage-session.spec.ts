import { test } from '../fixtures';
import { lodam } from '../utils/lodam.util';

test.describe('Gérer les sessions', () => {
  test('la session importée doit être visible', async ({ app }) => {
    // Soit un fichier d'export LODAM
    const lodamExcel = await lodam`
      number | name                 | targetedPosition             | birthDate                 | currentPosition         | lastPositionDate          | lastRankingDate           | movementType | observers | reporters | career | history
      ${1}   | ${'Pierre BOURDIEU'} | ${'Procureur CA  LYON - G3'} | ${new Date('1978-06-01')} | ${'Président CA  LYON'} | ${new Date('2020-07-15')} | ${new Date('2020-07-20')} | ${'A'}       | ${''}     | ${''}     | ${''}  | ${''}
    `;

    const file = new File([lodamExcel], `transparence_${new Date().toISOString().split('T')[0]}.xlsx`, {
      type: lodamExcel.type,
    });

    const today = new Date();
    const inAWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);

    const sessionName = `transparence ${crypto.randomUUID()}`;

    // Quand j'importe le fichier
    await app.pages.createSession.goto();
    await app.pages.createSession.with({
      name: sessionName,
      date: today,
      formation: 'PARQUET',
      observationClosingDate: inAWeek,
      file,
    });

    // Alors la session importée est visible sur la page dédiée
    await app.pages.manageSessions.sessionRow(sessionName).click();
    await app.pages.session.waitFor(sessionName);

    await app.page.getByRole('cell', { name: 'Pierre BOURDIEU' }).waitFor();
  });

  test.describe('soit une session importée', () => {
    let lastSession: string | undefined;

    test.beforeEach(async ({ app, registerUser }) => {
      if (lastSession) {
        await app.pages.manageSessions.goto();
        if ((await app.pages.manageSessions.sessionRow(lastSession).count()) > 0) {
          await app.pages.manageSessions.sessionRow(lastSession).click();
          await app.pages.session.waitFor(lastSession);
          return;
        }
      }

      const today = new Date();
      today.setUTCHours(0);
      const [day, month, year] = [today.getUTCDate(), today.getUTCMonth() + 1, today.getUTCFullYear()].map(
        (x) => x.toString().padStart(2, '0'),
      );

      const name = `Transparence ${crypto.randomUUID()}`;

      const lolfiForm = await app.pages.admin.goto('newIngestion');
      await lolfiForm.upload({
        sessions: [
          {
            name,
            createdAt: `${day}/${month}/${year}`,
            candidates: [
              {
                firstName: 'pierre',
                lastName: 'bourdieu',
                position: {
                  function: { id: 'PR', label: 'procureur général', formation: 'PARQUET' },
                  jurisdiction: { id: 'CA  LYON' },
                  grade: 'G2',
                },
                targetPosition: {
                  function: {
                    id: '1PRA',
                    label: 'premier procureur de la République adjoint',
                    formation: 'PARQUET',
                  },
                  jurisdiction: { id: 'CA  LYON' },
                  grade: 'G3',
                },
              },
              {
                firstName: 'anna',
                lastName: 'harendt',
                targetPosition: {
                  grade: 'G2',
                  function: { id: 'P', formation: 'PARQUET', label: 'président' },
                  jurisdiction: { id: 'CA  STRASBOURG' },
                },
                position: {
                  grade: 'G2',
                  jurisdiction: { id: 'CA  LYON' },
                  function: {
                    id: 'DET',
                    label: 'Détachement',
                    formation: 'PARQUET',
                  },
                },
              },
              {
                firstName: 'michel',
                lastName: 'foucault',
                position: {
                  function: { id: 'P', formation: 'PARQUET', label: 'président' },
                  jurisdiction: { id: 'CA  AGEN' },
                  grade: 'G2',
                },
                targetPosition: {
                  function: { id: 'P', formation: 'PARQUET', label: 'président' },
                  jurisdiction: { id: 'CA  METZ' },
                  grade: 'G3',
                },
              },
            ],
          },
        ],
      });

      // oxfmt-ignore
      await registerUser({ firstName: 'Antonio', lastName: 'GRAMSCI', email: `antonio.gramsci+${crypto.randomUUID()}@justice.fr`, gender: 'MALE', role: 'MEMBRE_COMMUN' });

      await app.pages.manageSessions.goto();
      await app.pages.manageSessions.sessionRow(name).click();
      await app.pages.session.waitFor(name);

      lastSession = name;
    });

    test(`j'affecte un rapporteur`, async ({ app }) => {
      const page = app.pages.session;

      // Quand j'affecte "Antonio GRAMSCI" à "Pierre BOURDIEU" depuis son panneau
      await page.editAffectation('BOURDIEU PIERRE', { reporters: ['Antonio GRAMSCI'] });

      // Alors "ANTONIO GRAMSCI" est désigné rapporteur de "Pierre BOURDIEU"
      const row = page.sessionRow({ name: 'BOURDIEU PIERRE' });
      await row.locator(app.page.getByRole('cell', { name: 'AG' })).waitFor({ timeout: 800 });
    });

    test(`je définis des priorités à un dossier`, async ({ app }) => {
      const page = app.pages.session;

      // Quand je sélectionne les priorités "Étoilé, Outre-mer" pour la proposition de "Pierre BOURDIEU"
      await page.editAffectation('BOURDIEU PIERRE', { priorities: ['Outre-mer', 'Étoilé'] });

      // Alors la cellule "Priorité(s)" de la ligne affectée contient "Étoilé, Outre-mer"
      const priorities = page.sessionRow({ name: 'BOURDIEU PIERRE' }).getByRole('cell').nth(4);
      await test.expect(priorities).toContainText('Outre-mer');
      await test.expect(priorities).toContainText('Étoilé');
    });

    test(`j'exporte les dossiers au format xlsx`, async ({ app }) => {
      const page = app.pages.session;

      // Quand je demande l'export du tableau
      const [download] = await Promise.all([
        app.page.waitForEvent('download'),
        page.exportAsExcelButton.click(),
      ]);

      // Alors le fichier reçu porte le nom daté envoyé par le serveur
      test.expect(download.suggestedFilename()).toMatch(/^dossiers-nomination-\d{4}-\d{2}-\d{2}\.xlsx$/);
      test.expect(await download.failure()).toBeNull();
    });
  });
});
