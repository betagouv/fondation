import {
  type LolfiAdministrativePosition,
  type LolfiFormationEnum,
  type LolfiFunction,
  type LolfiGradeEnum,
  type LolfiJurisdiction,
  type LolfiJurisdictionType,
} from '../src';

import administrativePositions from './referential/administrative-positions.json';
import functions from './referential/functions.json';
import jurisdictionTypes from './referential/jurisdiction-types.json';
import jurisdictions from './referential/jurisdictions.json';
import positionKinds from './referential/position-kinds.json';

/* Exported from staging on 2026-10-07. It holds no personal data: the referential is institutional,
   and the position kinds only count which function exists in which jurisdiction type at which grade */

export type PositionKind = {
  count: number;
  functionId: string;
  grade: LolfiGradeEnum;
  jurisdictionType: string;
};

const NOT_A_COURT = ['DET', 'SAB', '_NR'];

export class LolfiReferential {
  readonly administrativePositions = administrativePositions as readonly LolfiAdministrativePosition[];
  readonly functions = functions as readonly LolfiFunction[];
  readonly jurisdictions = jurisdictions as readonly LolfiJurisdiction[];
  readonly jurisdictionTypes = jurisdictionTypes as readonly LolfiJurisdictionType[];

  readonly detachment = this.jurisdiction('DETACHEMENT');
  readonly noAssignment = this.jurisdiction('SANS AFFECTATION');

  readonly #functions = new Map(this.functions.map((f) => [f.id, f]));
  readonly #jurisdictionsByType = Map.groupBy(this.jurisdictions, (j) => j.jurisdictionType);
  readonly #positionKinds = (positionKinds as readonly PositionKind[]).filter(
    (k) => !NOT_A_COURT.includes(k.jurisdictionType),
  );

  administrativePosition(id: string): LolfiAdministrativePosition {
    const found = this.administrativePositions.find((p) => p.id === id);
    if (!found) throw new Error(`Unknown administrative position ${id}`);
    return found;
  }

  function(id: string): LolfiFunction {
    const found = this.#functions.get(id);
    if (!found) throw new Error(`Unknown function ${id}`);
    return found;
  }

  jurisdiction(id: string): LolfiJurisdiction {
    const found = this.jurisdictions.find((j) => j.id === id);
    if (!found) throw new Error(`Unknown jurisdiction ${id}`);
    return found;
  }

  jurisdictionsOf(type: string): readonly LolfiJurisdiction[] {
    return this.#jurisdictionsByType.get(type) ?? [];
  }

  positionKindsWeightedByCount(filter: {
    formation: LolfiFormationEnum;
    grade?: LolfiGradeEnum;
  }): ReadonlyMap<PositionKind, number> {
    return new Map(
      this.#positionKinds
        .filter((k) => this.function(k.functionId).formation === filter.formation)
        .filter((k) => !filter.grade || k.grade === filter.grade)
        .filter((k) => this.jurisdictionsOf(k.jurisdictionType).length > 0)
        .map((k) => [k, k.count]),
    );
  }
}
