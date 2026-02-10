import { test } from '../fixtures';

test.describe('Se connecter', () => {
  test("L'utilisateur peut se connecter", async ({ userSg, anonymousApp: app }) => {
    // Soit un profile SG existant
    // Lorsque l'on accède à la page d'authentification
    await app.pages.login.goto();

    // Et que l'on saisit des identifiants valides
    // Alors on est automatiquement basculé sur la page d'accueil du SG
    await app.pages.login.with({ email: userSg.email, password: userSg.password });
  });
});
