import { Magistrat } from 'shared-models';
import { AffectationRepository } from 'src/nominations-context/business-logic/gateways/repositories/affectation.repository';
import {
  Affectation,
  AffectationSnapshot,
} from 'src/nominations-context/business-logic/models/affectation';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export class FakeAffectationRepository implements AffectationRepository {
  private fakeAffectations: Record<string, AffectationSnapshot> = {};

  save(affectation: Affectation) {
    return async () => {
      const snapshot = affectation.snapshot();
      this.fakeAffectations[snapshot.id] = snapshot;
    };
  }

  affectations(
    sessionId: string,
  ): TransactionableAsync<Record<Magistrat.Formation, Affectation>> {
    return async () => {
      const affectations = Object.values(this.fakeAffectations).filter(
        (affectation) => affectation.sessionId === sessionId,
      );

      return affectations.reduce(
        (acc, affectation) => {
          acc[affectation.formation] = Affectation.fromSnapshot(affectation);
          return acc;
        },
        {} as Record<Magistrat.Formation, Affectation>,
      );
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
