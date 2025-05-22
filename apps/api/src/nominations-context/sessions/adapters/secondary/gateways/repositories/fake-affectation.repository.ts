import { AffectationRepository } from 'src/nominations-context/sessions/business-logic/gateways/repositories/affectation.repository';
import {
  Affectation,
  AffectationSnapshot,
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
      const snapshot = Object.values(this.fakeAffectations).find(
        (affectation) => affectation.sessionId === sessionId,
      );
      return snapshot ? Affectation.fromSnapshot(snapshot) : null;
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
