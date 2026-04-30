import { test } from '../fixtures';

test.describe('Members', () => {
  test('it should exclude a jurisdiction', async ({ registerUser, app, http }) => {
    // Soit une juridiction "Cours d'appel de Lyon"
    await http.jurisdictions.createJurisdiction([
      { codejur: 'CA  LYON', typeJur: 'CA', ville: 'Lyon', libelle: "Cours d'appel de Lyon" }
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

    // Et que je cherche "Lyon"
    await modal.search.fill('Lyon');
    await modal.select("Cours d'appel de Lyon (CA  LYON)");
    // Et que je sélectionne "Cours d'appel de Lyon"
    await modal.saveButton.click();
    // Et que je sauvegarde mon choix
    await modal.dialog.waitFor({ state: 'hidden' });

    // Alors "Cours d'appel de Lyon" est renseignée comme juridiction exclue du membre
    const excludedJurisdiction = await app.pages.members.memberInfo('Juridictions exclues').textContent();
    test.expect(excludedJurisdiction).toContain("Cours d'appel de Lyon");
  });
});
