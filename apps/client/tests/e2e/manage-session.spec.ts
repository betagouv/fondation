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
      type: lodamExcel.type
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
      file
    });

    // Alors la session importée est visible sur la page dédiée
    await app.pages.manageSessions.sessionRow(sessionName).click();
    await app.pages.session.waitFor();

    await app.page.getByRole('cell', { name: 'Pierre BOURDIEU' }).waitFor();
  });

  test.describe('soit une session importée', () => {
    let lastSession: string | undefined;

    test.beforeEach(async ({ app, registerUser }) => {
      if (lastSession) {
        await app.pages.manageSessions.goto();
        if ((await app.pages.manageSessions.sessionRow(lastSession).count()) > 0) {
          await app.pages.manageSessions.sessionRow(lastSession).click();
          await app.pages.session.waitFor();

          console.debug('SKIPPED');
          return;
        }
      }

      const lodamExcel = await lodam`
        number | name                 | targetedPosition                   | birthDate                 | currentPosition         | lastPositionDate          | lastRankingDate           | movementType | observers | reporters | career | history
        ${1}   | ${'Pierre BOURDIEU'} | ${'Procureur CA  LYON - G3'}       | ${new Date('1930-08-01')} | ${'Président CA  LYON'} | ${new Date('2020-07-15')} | ${new Date('2020-07-20')} | ${'A'}       | ${''}     | ${''}     | ${''}  | ${''}
        ${2}   | ${'Anna HARENDT'}    | ${'Président CA  STRASBOURG - G3'} | ${new Date('1906-10-14')} | ${'DETACHEMENT'}        | ${new Date('2020-07-15')} | ${new Date('2020-07-20')} | ${'A'}       | ${''}     | ${''}     | ${''}  | ${''}
        ${3}   | ${'Michel FOUCAULT'} | ${'Président CA  METZ - G3'}       | ${new Date('1926-10-15')} | ${'Président CA  AGEN'} | ${new Date('2020-07-15')} | ${new Date('2020-07-20')} | ${'E'}       | ${''}     | ${''}     | ${''}  | ${''}
      `;

      const file = new File([lodamExcel], `transparence_${new Date().getTime()}.xslsx`, {
        type: lodamExcel.type
      });

      const today = new Date();
      today.setUTCHours(0);
      const inAWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);

      await app.pages.createSession.goto();

      const name = `Transparence ${crypto.randomUUID()}`;
      await app.pages.createSession.with({
        name,
        file,
        date: today,
        observationClosingDate: inAWeek,
        formation: 'PARQUET'
      });

      // prettier-ignore
      {
        await registerUser({ firstName: 'Antonio', lastName: 'GRAMSCI', email: `antonio.gramsci+${crypto.randomUUID()}@justice.fr`, gender: 'MALE', role: 'MEMBRE_COMMUN' });
        await registerUser({ firstName: 'Julie', lastName: 'PERRIN', email: `julie.perrin+${crypto.randomUUID()}@justice.fr`, gender: 'FEMALE', role: 'MEMBRE_DU_SIEGE' });
        await registerUser({ firstName: 'Juste', lastName: 'DUMONT', email: `juste.dumont+${crypto.randomUUID()}@justice.fr`, gender: 'MALE', role: 'MEMBRE_DU_PARQUET' });
      }

      await app.pages.manageSessions.sessionRow(name).click();
      await app.pages.session.waitFor();

      lastSession = name;
    });

    test(`j'affecte un rapporteur`, async ({ app }) => {
      const page = app.pages.session;

      // Quand je bascule en édition
      await page.switchToEditModeButton.click();
      await page.switchToReadModeButton.waitFor();

      // Et que je sélectionne "ANTONIO GRAMSCI" pour "Pierre BOURDIEU"
      const row = page.sessionRow({ name: 'Pierre BOURDIEU' });

      await row.locator(page.selectReporterButton).click();
      await page.searchReporterInput.fill('Antonio');
      await app.page.getByRole('checkbox', { name: 'GRAMSCI ANTONIO' }).first().click({ force: true });

      // Et que je sauvegarde les affectations
      await page.saveAffectationsButton.click();

      // Alors "ANTONIO GRAMSCI" est désigné rapporteur de "Pierre BOURDIEU"
      await row.locator(app.page.getByRole('cell', { name: 'ANTONIO GRAMSCI' })).waitFor({ timeout: 800 });
    });

    test(`je définis des priorités à un dossier`, async ({ app }) => {
      const page = app.pages.session;

      // Quand je bascule en édition
      await page.switchToEditModeButton.click();
      await page.switchToReadModeButton.waitFor();

      // Et que je sélectionne les priorités "Étoilé, Outre-mer" pour la proposition de "Perre BOURDIEU"
      const row = page.sessionRow({ name: 'Pierre BOURDIEU' });

      await row.locator(page.prioritiesSelectBox).click();
      await page.priorityCheckbox({ name: 'Outre-mer' }).first().click({ force: true });
      await page.priorityCheckbox({ name: 'Étoilé' }).first().click({ force: true });
      await page.saveAffectationsButton.click();

      // Et que je valide ma sélection
      await page.switchToEditModeButton.waitFor();

      // Alors les cellules "Priorité(s)" des lignes affectées doivent contenir "Étoilé, Outre-mer"
      const textContent = await row.locator('td:nth-of-type(7)').textContent();
      test.expect(textContent).toContain('Outre-mer');
      test.expect(textContent).toContain('Étoilé');
    });

    test(`je définis des priorités à plusieurs dossiers`, async ({ app }) => {
      const page = app.pages.session;

      // Quand je bascule en édition
      await page.switchToEditModeButton.click();
      await page.switchToReadModeButton.waitFor();

      // Et que je sélectionne les 2 dernières lignes
      await page.sessionRow({ name: 'Anna HARENDT' }).getByRole('checkbox').first().click({ force: true });
      await page.sessionRow({ name: 'Michel FOUCAULT' }).getByRole('checkbox').first().click({ force: true });

      // Et que j'ouvre la dialogue d'actions groupées
      await page.batchActionsButton.click();
      await app.page.getByRole('dialog').waitFor();

      // Et que je sélectionne les priorités "Étoilé" et "Outre-mer"
      await app.page.getByRole('checkbox', { name: 'Étoilé' }).click({ force: true });
      await app.page.getByRole('checkbox', { name: 'Outre-mer' }).click({ force: true });

      // Et que je valide ma sélection
      await app.page.getByRole('button', { name: 'Appliquer' }).click();

      // Alors les sélecteurs de priorités des lignes affectées doivent contenir "Étoilé, Outre-mer"
      for (const name of ['Anna HARENDT', 'Michel FOUCAULT']) {
        const selectBoxContent = await page
          .sessionRow({ name })
          .locator(page.prioritiesSelectBox)
          .textContent();

        test.expect(selectBoxContent).toContain('E');
        test.expect(selectBoxContent).toContain('OM');
      }

      // Quand je quitte le mode édition
      await page.saveAffectationsButton.click();
      await page.switchToEditModeButton.waitFor();

      // Alors les cellules "Priorité(s)" des lignes affectées doivent contenir "Étoilé, Outre-mer"
      for (const name of ['Anna HARENDT', 'Michel FOUCAULT']) {
        const cellContent = await page.sessionRow({ name }).locator('td:nth-of-type(7)').textContent();

        test.expect(cellContent).toContain('Étoilé');
        test.expect(cellContent).toContain('Outre-mer');
      }
    });
  });
});
