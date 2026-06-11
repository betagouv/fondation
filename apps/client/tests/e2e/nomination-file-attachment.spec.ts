import { test } from '../fixtures';

test.describe('Pièces jointes de dossier de nomination', () => {
  test("j'ajoute, vois puis supprime une pièce jointe", async ({ app, http }) => {
    // Soit une session avec un dossier de nomination
    const name = `Transparence ${crypto.randomUUID()}`;
    const today = new Date();
    today.setUTCHours(0);
    const inAWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);

    const { id: sessionId } = await http.sessions.createSession({
      name,
      date: today,
      formation: 'PARQUET',
      observationClosingDate: inAWeek,
    });

    await http.sessions.attachNominationFiles({
      sessionId,
      files: [
        {
          fileNumber: 1,
          name: 'Pierre BOURDIEU',
          birthDate: new Date('1930-08-01'),
          currentPosition: 'Président CA  LYON',
          grade: 'G2',
          targetedPosition: 'Procureur CA  LYON',
          targetedGrade: 'G3',
          lastPositionDate: new Date('2020-07-15'),
          lastRankingDate: new Date('2020-07-15'),
        },
      ],
    });

    await app.pages.manageSessions.goto();
    await app.pages.manageSessions.sessionRow(name).click();
    await app.pages.session.waitFor(name);

    // Quand j'ouvre le détail du magistrat
    const modal = await app.pages.session.openMagistratDetails('Pierre BOURDIEU');

    // Et que j'ajoute une pièce jointe
    const attachment = new File(['preuve'], 'preuve.pdf', { type: 'application/pdf' });
    await modal.addAttachment(attachment);

    // Alors la pièce jointe est visible
    await modal.attachment(attachment.name).waitFor();

    // Quand je supprime la pièce jointe
    await modal.deleteAttachment(attachment.name);

    // Alors elle n'est plus visible
    await modal.attachment(attachment.name).waitFor({ state: 'detached' });
  });
});
