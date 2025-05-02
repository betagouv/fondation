import { Magistrat } from 'shared-models';
import { AffectationRepository } from 'src/nominations-context/business-logic/gateways/repositories/affectation.repository';
import {
  Affectation,
  AffectationSnapshot,
} from 'src/nominations-context/business-logic/models/affectation';

type TransparenceId = string;

export class FakeAffectationRepository implements AffectationRepository {
  private affectations: Record<
    `${TransparenceId}-${Magistrat.Formation}`,
    AffectationSnapshot
  > = {};

  save(affectation: Affectation) {
    return async () => {
      const snapshot = affectation.snapshot();
      this.affectations[`${snapshot.transparenceId}-${snapshot.formation}`] =
        snapshot;
    };
  }

  addAffectations(...affectations: AffectationSnapshot[]) {
    affectations.forEach((affectation) => {
      this.affectations[
        `${affectation.transparenceId}-${affectation.formation}`
      ] = affectation;
    });
  }

  getAffectations() {
    return Object.values(this.affectations);
  }
}
