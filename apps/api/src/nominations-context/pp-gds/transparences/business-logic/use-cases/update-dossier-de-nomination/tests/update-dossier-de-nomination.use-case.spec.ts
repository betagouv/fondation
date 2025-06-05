import {
  commandWithDatePassageAuGrade,
  commandWithDatePriseDeFonctionPosteActuel,
  commandWithInformationCarriere,
  commandWithNewFolderNumber,
  commandWithNewObservers,
  getDependencies,
} from './update-dossier-de-nomination.tests-setup';

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

  it('updates an existing dossier de nomination with new folder number', async () => {
    await deps.updateDossierDeNomination(commandWithNewFolderNumber);
    deps.expectDossierWithNewFolderNumber();
  });

  it('updates an existing dossier de nomination with date passage au grade', async () => {
    await deps.updateDossierDeNomination(commandWithDatePassageAuGrade);
    deps.expectDossierWithDatePassageAuGrade();
  });

  it('updates an existing dossier de nomination with date prise de fonction poste actuel', async () => {
    await deps.updateDossierDeNomination(
      commandWithDatePriseDeFonctionPosteActuel,
    );
    deps.expectDossierWithDatePriseDeFonctionPosteActuel();
  });

  it('updates an existing dossier de nomination with information carriere', async () => {
    await deps.updateDossierDeNomination(commandWithInformationCarriere);
    deps.expectDossierWithInformationCarrière();
  });
});
