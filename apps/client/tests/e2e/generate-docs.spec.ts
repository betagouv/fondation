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

    // Et que j'affecte "Sophie de Bawr" aux 3 dossiers
    for (const name of ['BOURDIEU PIERRE', 'HARENDT ANNA', 'GRAMSCI ANTONIO']) {
      await page.editAffectation({ name }, { reporters: [new RegExp(memberLastName, 'i')] });
    }

    // Et que je publie aux membres
    await page.publishAffectationsButton.click();
    await app.page.getByRole('alert').waitFor();

    // Quand je définis une issue "SURSIS" à tous les dossiers
    for (const name of ['BOURDIEU PIERRE', 'HARENDT ANNA', 'GRAMSCI ANTONIO']) {
      await page.defineOutcome({ name }, 'SURSIS');
    }
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

    // Quand j'ouvre la génération d'un ordre du jour
    const agendaPage = await app.pages.session.startAgendaGeneration();

    // Et que je sélectionne les 3 dossiers, qu'un sursis exclut de la sélection par défaut
    await agendaPage.selectAllFilesCheckbox.click({ force: true });
    await agendaPage.goToNextStep();

    const { agendaId } = await agendaPage.fill({ sessionMeetingDate: new Date(), chairman: chairman.id });

    await app.pages.manageSessions.goto();
    await app.pages.manageSessions.sessionRow(sessionName).click();
    await app.pages.session.waitFor(sessionName);

    const officialReportPage = await app.pages.session.startOfficialReportGeneration();
    const justiceContact = await officialReportPage.fill({
      agendaId,
      startTime: '10:00',
      endTime: '10:10',
    });

    const contact = `Geoffroy de Lagasnerie (${crypto.randomUUID()}), représentant de la direction`;
    await justiceContact.fill(contact);
    await justiceContact.button(contact).click();
    await justiceContact.confirm();
    await justiceContact.blur();
    await justiceContact.fill(contact);
    await justiceContact.option(contact).click({ force: true });

    await test.expect(justiceContact.input.inputValue()).resolves.toBeDefined();

    await officialReportPage.submit();
  });

  test('prépare un ordre du jour à partir des propositions cochées dans le tableau', async ({ app }) => {
    const page = app.pages.session;

    // Quand je coche 2 propositions dans le tableau
    await page.selectFiles({ name: 'BOURDIEU PIERRE' }, { name: 'HARENDT ANNA' });

    // Et que je les ajoute à l'ordre du jour
    await page.addSelectionToAgendaButton.click();

    // Alors l'ordre du jour en préparation contient ces 2 propositions
    await test.expect(page.agendaBasket).toContainText('2');

    // Et quand je filtre le tableau sur l'ordre du jour en préparation
    await page.agendaBasket.click();

    // Alors seules ces 2 propositions restent affichées
    await test.expect(page.sessionRow({ name: 'BOURDIEU PIERRE' })).toBeVisible();
    await test.expect(page.sessionRow({ name: 'GRAMSCI ANTONIO' })).toBeHidden();

    // Et quand j'en retire une depuis ce tableau filtré
    await page.selectFiles({ name: 'HARENDT ANNA' });
    await page.removeSelectionFromAgendaButton.click();

    // Alors elle quitte l'ordre du jour en préparation
    await test.expect(page.agendaBasket).toContainText('1');
    await test.expect(page.sessionRow({ name: 'HARENDT ANNA' })).toBeHidden();

    // Et la génération d'un ordre du jour démarre avec la proposition restante
    const agendaPage = await page.startAgendaGeneration();
    await test.expect(agendaPage.selectAllFilesCheckbox).toHaveAccessibleName(/1 proposition sélectionnée/);
  });
});
