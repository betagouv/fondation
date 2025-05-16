import { DossierDeNominationRepository } from 'src/nominations-context/business-logic/gateways/repositories/dossier-de-nomination.repository';
import {
  DossierDeNomination,
  DossierDeNominationSnapshot,
} from 'src/nominations-context/business-logic/models/dossier-de-nomination';

export class FakeDossierDeNominationRepository
  implements DossierDeNominationRepository
{
  private dossiers: Record<string, DossierDeNominationSnapshot> = {};

  save(dossier: DossierDeNomination) {
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

  ajouterDossiers(...dossiers: DossierDeNominationSnapshot[]) {
    for (const dossier of dossiers) {
      this.dossiers[dossier.id] = dossier;
    }
  }

  getDossiers() {
    return Object.values(this.dossiers);
  }
}
