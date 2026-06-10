import { test } from '../fixtures';

test.describe('Générer un ordre du jour', () => {
  let sessionName: string;

  test.beforeEach(async ({ app, registerUser }) => {
    if (sessionName) {
      await app.pages.manageSessions.goto();
      await app.pages.manageSessions.sessionRow(sessionName).click();
      await app.pages.session.waitFor(sessionName);
      return;
    }

    const today = new Date();
    today.setUTCHours(0);
    const [day, month, year] = [today.getUTCDate(), today.getUTCMonth() + 1, today.getUTCFullYear()].map(
      (x) => x.toString().padStart(2, '0'),
    );

    sessionName = `Transparence ODJ ${crypto.randomUUID()}`;

    // Soit une session PARQUET avec 3 dossiers importée via LOLFI
    const lolfiForm = await app.pages.admin.goto('newIngestion');
    await lolfiForm.upload({
      sessions: [
        {
          name: sessionName,
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
              position: {
                grade: 'G2',
                function: { id: 'DET', label: 'Détachement', formation: 'PARQUET' },
                jurisdiction: { id: 'CA  LYON' },
              },
              targetPosition: {
                grade: 'G2',
                function: { id: 'P', formation: 'PARQUET', label: 'président' },
                jurisdiction: { id: 'CA  STRASBOURG' },
              },
            },
            {
              firstName: 'antonio',
              lastName: 'gramsci',
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

    const memberLastName = 'de bawr ' + crypto.randomUUID();
    // Et un rapporteur "Sophie de Bawr"
    await registerUser({
      firstName: 'sophie',
      lastName: memberLastName,
      email: `sophie.debawr+${crypto.randomUUID()}@justice.fr`,
      gender: 'FEMALE',
      role: 'MEMBRE_COMMUN',
    });

    // Quand je navigue vers la session
    await app.pages.manageSessions.goto();
    await app.pages.manageSessions.sessionRow(sessionName).click();
    await app.pages.session.waitFor(sessionName);

    const page = app.pages.session;

    // Et que je bascule en mode édition
    await page.switchToEditModeButton.click();
    await page.switchToReadModeButton.waitFor();

    // Et que j'affecte "Sophie de Bawr" aux 3 dossiers
    for (const name of ['BOURDIEU PIERRE', 'HARENDT ANNA', 'GRAMSCI ANTONIO']) {
      const row = page.sessionRow({ name });
      await row.locator(page.selectReporterButton).click();
      await page.searchReporterInput.fill(memberLastName);
      await app.page.getByRole('checkbox', { name: memberLastName }).first().click({ force: true });
      await app.page.getByRole('document').click();
    }

    // Et que je sauvegarde les affectations
    await page.saveAffectationsButton.click();
    await page.switchToEditModeButton.waitFor();

    // Et que je publie aux membres
    await page.publishAffectationsButton.click();
    await app.page.getByRole('alert').waitFor();
  });

  test('génère un ordre du jour et un PV à partir de 3 dossiers sélectionnés', async ({ app, http }) => {
    test.setTimeout(10_000);

    // Et un utilisateur Michel Foucault membre du parquet
    const chairman = await http.auth.registerUser({
      defaultUser: {
        firstName: 'michel ' + crypto.randomUUID(),
        lastName: 'foucault',
        email: `michel.foucault+${crypto.randomUUID()}@justice.fr`,
        gender: 'MALE' as const,
      },
      role: 'MEMBRE_DU_PARQUET',
    });

    // Avec le titre "Président du Parquet"
    await http.http.put(`/api/members/v1/${chairman.id}/title`, {
      data: { title: 'PRESIDENT_PARQUET' },
    });

    const firstSecretary = await http.auth.registerUser({
      role: 'ADJOINT_SECRETAIRE_GENERAL',
      defaultUser: {
        firstName: `xavier ${crypto.randomUUID()}`,
        lastName: 'dufresnes',
        email: `xavier.dufresne+${crypto.randomUUID()}@justice.fr`,
        gender: 'MALE' as const,
      },
    });

    // Avec le titre "Président du Parquet"
    await http.http.put(`/api/administration/v1/users/${firstSecretary.id}/role`, {
      data: { role: 'FIRST_SECRETARY' },
    });

    const page = app.pages.session;

    // Quand je bascule en mode édition
    await page.switchToEditModeButton.click();
    await page.switchToReadModeButton.waitFor();

    // Et que je sélectionne les 3 dossiers
    for (const name of ['BOURDIEU PIERRE', 'HARENDT ANNA', 'GRAMSCI ANTONIO']) {
      await page.sessionRow({ name }).getByRole('checkbox').first().click({ force: true });
    }

    // Et que je clique sur "Ajouter à l'ODJ"
    await app.page.getByRole('button', { name: "Ajouter à l'ODJ" }).click();

    // Et que je clique sur "Générer l'ODJ (3)"
    await app.page.getByRole('button', { name: /Générer l'ODJ \(3\)/ }).click();

    // Alors je suis redirigé vers la page de création de l'ordre du jour
    await app.page.waitForURL(/\/docs\/ordre-du-jour$/);

    // Quand je clique sur "Définir les données de l'ODJ"
    await app.page.getByRole('button', { name: /Définir les données de l'ODJ/ }).click();

    // Alors l'étape 2 (métadonnées) est affichée
    const todayFormatted = new Date().toISOString().split('T')[0];

    // Et que je renseigne la "Date de la séance" avec la date du jour
    await app.page.getByLabel('Date de la séance').fill(todayFormatted);

    // Et que je renseigne la "Date de l'ordre du jour" avec la date du jour
    await app.page.getByLabel("Date de l'ordre du jour").fill(todayFormatted);

    // Et que je sélectionne "Michel FOUCAULT" comme président de séance
    await app.page.getByLabel('Président de séance').selectOption(chairman.id);

    // Et que je génère l'ordre du jour
    await app.page.getByRole('button', { name: /Générer l'ordre du jour/ }).click();

    const agendaPattern = new URLPattern({
      pathname: '/secretariat-general/session/:sessionId/docs/ordre-du-jour/:agendaId/validation',
    });
    // Alors je suis redirigé vers la page de validation
    await app.page.waitForURL((url) => agendaPattern.test(url));
    const { agendaId } = agendaPattern.exec(app.page.url())!.pathname.groups;

    await app.pages.manageSessions.goto();
    await app.pages.manageSessions.sessionRow(sessionName).click();
    await app.pages.session.waitFor(sessionName);

    await app.page.getByRole('link', { name: 'Procès verbal' }).click();
    await app.page.getByLabel('Ordre du jour').selectOption(agendaId!);

    await test.expect(app.page.getByLabel('Président de séance').inputValue()).resolves.toBeDefined();
    await test.expect(app.page.getByLabel('Secrétaire général').inputValue()).resolves.toBeDefined();

    await app.page.getByLabel('Heure de début').fill('10:00');
    await app.page.getByLabel('Heure de fin').fill('10:10');

    const contact = `Geoffroy de Lagasnerie (${crypto.randomUUID()}), représentant de la direction`;
    await app.page.getByLabel('Représentant DSJ').fill(contact);
    await app.page.getByRole('option', { name: `«\u00A0${contact}\u00A0»` }).click();

    const justiceContactCreated = app.page.waitForResponse(/justice-contacts/);
    await app.page
      .getByRole('dialog')
      .locator(app.page.getByRole('button', { name: 'Confirmer' }))
      .click();
    await justiceContactCreated;

    await app.page.getByLabel('Représentant DSJ').blur();
    await app.page.getByLabel('Représentant DSJ').fill(contact);
    await app.page.getByRole('option', { name: contact }).first().click({ force: true });

    await test.expect(app.page.getByLabel('Représentant DSJ').inputValue()).resolves.toBeDefined();

    await app.page.getByRole('button', { name: 'Générer le PV' }).click();
    await app.page.waitForURL(/pv\/.+\/validation/);
  });
});
