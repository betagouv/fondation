import {
  commandWithNewObservers,
  getDependencies,
} from './update-observants.tests-setup';

describe('Update dossier de nomination', () => {
  let deps: ReturnType<typeof getDependencies>;

  beforeEach(() => {
    deps = getDependencies();
    deps.setupExistingDossierDeNomination();
  });

  it('updates an existing dossier de nomination with new observers', async () => {
    await deps.updateDossierDeNomination(commandWithNewObservers);
    deps.expectDossierWithNewObservers();
  });
});
