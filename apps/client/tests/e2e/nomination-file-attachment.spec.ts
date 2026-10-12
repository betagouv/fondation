import { test } from '../fixtures';

test.describe('Pièces jointes de dossier de nomination', () => {
  test("j'ajoute, vois puis supprime une pièce jointe", async ({ app }) => {
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
          candidates: [
            {
              firstName: 'pierre',
              lastName: 'bourdieu',
              position: {
                function: { formation: 'PARQUET', id: 'PR', label: 'procureur général' },
                grade: 'G2',
                jurisdiction: { id: 'CA  LYON' },
              },
              targetPosition: {
                function: {
                  formation: 'PARQUET',
                  id: '1PRA',
                  label: 'premier procureur de la République adjoint',
                },
                grade: 'G3',
                jurisdiction: { id: 'CA  LYON' },
              },
            },
          ],
          createdAt: `${day}/${month}/${year}`,
          name,
        },
      ],
    });

    await app.pages.manageSessions.goto();
    await app.pages.manageSessions.sessionRow(name).click();
    await app.pages.session.waitFor(name);

    // Quand j'ouvre le détail du magistrat
    const modal = await app.pages.session.openMagistratDetails('BOURDIEU PIERRE');

    // Et que j'ajoute une pièce jointe
    const attachment = new File(['preuve'], 'preuve.pdf', { type: 'application/pdf' });
    await modal.addAttachment(attachment);

    // Alors la pièce jointe est visible avec son type et son auteur
    await modal.attachment(attachment.name).waitFor();
    await modal.attachmentType('Fiche de juridiction').waitFor();
    await modal.attachmentAddedByMe().waitFor();

    // Quand je supprime la pièce jointe
    await modal.deleteAttachment(attachment.name);

    // Alors elle n'est plus visible
    await modal.attachment(attachment.name).waitFor({ state: 'detached' });
  });
});
