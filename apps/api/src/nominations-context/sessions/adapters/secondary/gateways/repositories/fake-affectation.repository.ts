import { AffectationRepository } from 'src/nominations-context/sessions/business-logic/gateways/repositories/affectation.repository';
import {
  Affectation,
  AffectationSnapshot,
  StatutAffectation,
} from 'src/nominations-context/sessions/business-logic/models/affectation';

export class FakeAffectationRepository implements AffectationRepository {
  private fakeAffectations: Record<string, AffectationSnapshot> = {};

  save(affectation: Affectation) {
    return async () => {
      const snapshot = affectation.snapshot();
      this.fakeAffectations[snapshot.id] = snapshot;
    };
  }

  bySessionId(sessionId: string) {
    return async () => {
      const affectations = Object.values(this.fakeAffectations).filter(
        (affectation) => affectation.sessionId === sessionId,
      );

      if (affectations.length === 0) return null;

      const brouillon = affectations.find(
        (a) => a.statut === StatutAffectation.BROUILLON,
      );

      if (brouillon) return Affectation.fromSnapshot(brouillon);

      const dernierePubliee = affectations
        .filter((a) => a.statut === StatutAffectation.PUBLIEE)
        .sort((a, b) => b.version - a.version)[0];

      return dernierePubliee ? Affectation.fromSnapshot(dernierePubliee) : null;
    };
  }

  derniereVersionPubliee(sessionId: string) {
    return async () => {
      const affectations = Object.values(this.fakeAffectations).filter(
        (affectation) =>
          affectation.sessionId === sessionId &&
          affectation.statut === StatutAffectation.PUBLIEE,
      );

      if (affectations.length === 0) return null;

      const derniere = affectations.sort((a, b) => b.version - a.version)[0];
      return derniere ? Affectation.fromSnapshot(derniere) : null;
    };
  }

  versionBrouillon(sessionId: string) {
    return async () => {
      const snapshot = Object.values(this.fakeAffectations).find(
        (affectation) =>
          affectation.sessionId === sessionId &&
          affectation.statut === StatutAffectation.BROUILLON,
      );
      return snapshot ? Affectation.fromSnapshot(snapshot) : null;
    };
  }

  prochainNumeroVersion(sessionId: string) {
    return async () => {
      const affectations = Object.values(this.fakeAffectations).filter(
        (affectation) => affectation.sessionId === sessionId,
      );

      if (affectations.length === 0) return 1;

      const maxVersion = Math.max(...affectations.map((a) => a.version));
      return maxVersion + 1;
    };
  }

  addAffectations(...affectations: AffectationSnapshot[]) {
    affectations.forEach((affectation) => {
      this.fakeAffectations[affectation.id] = affectation;
    });
  }

  getAffectations() {
    return Object.values(this.fakeAffectations);
  }
}
