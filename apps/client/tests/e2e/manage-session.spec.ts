import { test } from '../fixtures';
import { lodam } from '../utils/lodam.util';

test.describe('Manage sessions', () => {
  test('GIVEN a LODAM export file, WHEN I import the file, THEN I should see the file in the table', async ({
    app
  }) => {
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

    await app.pages.createSession.goto();
    await app.pages.createSession.with({
      name: sessionName,
      date: today,
      formation: 'PARQUET',
      observationClosingDate: inAWeek,
      file
    });

    await app.pages.manageSessions.sessionRow(sessionName).click();
    await app.pages.manageSingleSession.waitFor();

    await app.page.getByRole('cell', { name: 'Pierre BOURDIEU' }).waitFor();
  });
});
