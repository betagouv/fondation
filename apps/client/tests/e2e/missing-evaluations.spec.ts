import { expect, test } from '../fixtures';

test.describe('Évaluations manquantes', () => {
  test('je signale une évaluation manquante, je la commente puis je la marque comme ajoutée', async ({
    app,
  }) => {
    // Soit une session avec un dossier de nomination
    const name = `Transparence ${crypto.randomUUID()}`;
    const today = new Date();
    const [day, month, year] = [today.getUTCDate(), today.getUTCMonth() + 1, today.getUTCFullYear()].map(
      (x) => x.toString().padStart(2, '0'),
    );

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
          ],
        },
      ],
    });

    await app.pages.manageSessions.goto();
    await app.pages.manageSessions.sessionRow(name).click();
    await app.pages.session.waitFor(name);

    // Quand je signale une évaluation manquante depuis le dossier du magistrat
    const panel = await app.pages.session.openMagistratDetails('BOURDIEU PIERRE');
    await panel.flagMissingEvaluation();
    await panel.close();

    // Alors le magistrat apparaît dans l'onglet dédié
    await app.pages.session.goToMissingEvaluationsTab();
    await expect(app.pages.session.sessionRow({ name: 'BOURDIEU PIERRE' })).toBeVisible();

    // Quand je commente le suivi de cette évaluation
    await app.pages.session.commentMissingEvaluation('BOURDIEU PIERRE', 'Relancée le 12 août');

    // Alors le commentaire est visible sur la ligne
    await expect(
      app.pages.session.sessionRow({ name: 'BOURDIEU PIERRE' }).getByText('Relancée le 12 août'),
    ).toBeVisible();

    // Quand je marque l'évaluation comme ajoutée
    await app.pages.session.markMissingEvaluationAsDone('BOURDIEU PIERRE');

    // Alors la ligne disparaît du tableau
    await expect(app.pages.session.sessionRow({ name: 'BOURDIEU PIERRE' })).toBeHidden();
  });
});
