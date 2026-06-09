import { faker } from '@faker-js/faker/locale/fr';

import { test } from '../fixtures';

test.describe('Gérer les membres', () => {
  test("j'exclus une juridiction", async ({ registerUser, app }) => {
    // Soit une juridiction "Cour d'appel de Marseille"
    const today = new Date();
    today.setUTCHours(0);
    const [day, month, year] = [today.getUTCDate(), today.getUTCMonth() + 1, today.getUTCFullYear()].map(
      (x) => x.toString().padStart(2, '0'),
    );

    const jurisdictionId = `CA  MARSEILLE ${crypto.randomUUID()}`;

    const ingestion = await app.pages.admin.goto('newIngestion');
    await ingestion.upload({
      sessions: [
        {
          createdAt: `${day}/${month}/${year}`,
          candidates: [
            {
              firstName: faker.person.firstName(),
              lastName: faker.person.lastName(),
              position: {
                function: { id: 'P', formation: 'PARQUET', label: 'président' },
                jurisdiction: { id: jurisdictionId, label: "Cour d'appel de Marseille" },
                grade: 'G2',
              },
              targetPosition: {
                function: { id: 'P', formation: 'PARQUET', label: 'président' },
                jurisdiction: { id: 'TGI  LYON' },
                grade: 'G2',
              },
            },
          ],
        },
      ],
    });

    // Et un "Membre commun" "Michel Foucault"
    const member = { firstName: `michel ${crypto.randomUUID()}`, lastName: `foucault` };
    await registerUser(member);

    // Quand je consulte la liste des membres
    await app.pages.members.goto();
    // Et que j'édite "Michel Foucault"
    await app.pages.members.gotoEditMember(`${member.firstName} ${member.lastName}`);

    // Et que j'ouvre la boite de dialogue d'exclusion des juridictions
    const modal = await app.pages.members.openJurisdictionExclusionModal();

    // Et que je cherche "Marseille"
    await modal.search.fill(jurisdictionId);
    await app.page.waitForResponse('**/api/jurisdictions/v1?search=*');

    await modal.select(`Cour d'appel de Marseille (${jurisdictionId})`);
    // Et que je sélectionne "Cour d'appel de Marseille"
    await modal.saveButton.click();
    // Et que je sauvegarde mon choix
    await modal.dialog.waitFor({ state: 'hidden' });

    // Alors "Cours d'appel de Marseille" est renseignée comme juridiction exclue du membre
    const excludedJurisdiction = await app.pages.members.memberInfo('Juridictions exclues').textContent();
    test.expect(excludedJurisdiction).toContain("Cour d'appel de Marseille");
  });
});
