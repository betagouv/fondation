import { test } from '../fixtures';

test.describe('Gérer les membres', () => {
  test("j'exclus une juridiction", async ({ registerUser, app, http }) => {
    /**
     * @warning
     *  these tests might conflict with back-end e2e tests, since they're running
     *  on the same db
     */

    // Soit une juridiction "Cour d'appel de Marseille"
    await http.data.createJurisdiction([
      { codejur: 'CA  MARSEILLE', typeJur: 'CA', ville: 'Marseille', libelle: "Cour d'appel de Marseille" },
    ]);

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
    await modal.search.fill('Marseille');
    await app.page.waitForResponse('**/api/jurisdictions/v1?search=Marseille');

    await modal.select("Cour d'appel de Marseille");
    // Et que je sélectionne "Cour d'appel de Marseille"
    await modal.saveButton.click();
    // Et que je sauvegarde mon choix
    await modal.dialog.waitFor({ state: 'hidden' });

    // Alors "Cours d'appel de Marseille" est renseignée comme juridiction exclue du membre
    const excludedJurisdiction = await app.pages.members.memberInfo('Juridictions exclues').textContent();
    test.expect(excludedJurisdiction).toContain("Cour d'appel de Marseille");
  });
});
