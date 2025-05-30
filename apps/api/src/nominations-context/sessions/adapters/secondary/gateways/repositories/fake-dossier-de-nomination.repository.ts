import { TypeDeSaisine } from 'shared-models';
import { DossierDeNominationRepository } from 'src/nominations-context/sessions/business-logic/gateways/repositories/dossier-de-nomination.repository';
import {
  DossierDeNomination,
  DossierDeNominationSnapshot,
} from 'src/nominations-context/sessions/business-logic/models/dossier-de-nomination';

export class FakeDossierDeNominationRepository<
  S extends TypeDeSaisine | unknown = unknown,
> implements DossierDeNominationRepository<S>
{
  private dossiers: Record<string, DossierDeNominationSnapshot<S>> = {};

  save(dossier: DossierDeNomination<S>) {
    return async () => {
      this.dossiers[dossier.id] = dossier.snapshot();
    };
  }

  dossierDeNomination(id: string) {
    return async () => {
      const snapshot = this.dossiers[id];
      if (!snapshot) return null;
      return DossierDeNomination.fromSnapshot(snapshot);
    };
  }

  findByImportedId(nominationFileImportedId: string) {
    return async () => {
      const snapshot = Object.values(this.dossiers).find(
        (dossier) =>
          dossier.nominationFileImportedId === nominationFileImportedId,
      );

      if (!snapshot) return null;

      return DossierDeNomination.fromSnapshot(snapshot);
    };
  }

  ajouterDossiers(...dossiers: DossierDeNominationSnapshot<S>[]) {
    for (const dossier of dossiers) {
      this.dossiers[dossier.id] = dossier;
    }
  }

  getDossiers() {
    return Object.values(this.dossiers);
  }
}
