import { type Faker } from '@faker-js/faker';

import {
  type LolfiArchiveContent,
  type LolfiFormationEnum,
  type LolfiGradeEnum,
  type LolfiPosition,
} from '../src';

import { LolfiReferential } from './lolfi-referential';
import { drawMagistratCareer } from './magistrat-career';
import { drawMagistratIdentity } from './magistrat-identity';
import { Random } from './random';

type GuaranteedPosition = {
  functionId: string;
  grade: LolfiGradeEnum;
  jurisdictionId: string;
  proposedCandidateAdministrativePosition?: string;
};

type FictitiousTransparence = {
  candidates: number;
  createdAt: string;
  /* Rare positions the application treats apart, which a weighted draw would seldom reach */
  guaranteedPositions?: readonly GuaranteedPosition[];
  label: string;
  parquetPositionsShare: number;
  profiled?: boolean;
};

type FictitiousCandidate = LolfiArchiveContent['sessions'][number]['candidates'][number];

/* Staging runs as production, which only synchronises the transparences published from 2026-06-01:
   keep it equal to FIRST_SYNCHRONISED_PUBLICATION in apps/api/src/modules/ingest/infrastructure/finders/lolfi-sessions.finder.ts */
export const FIRST_SYNCHRONISED_PUBLICATION = '01/06/2026';

export const FICTITIOUS_TRANSPARENCES: readonly FictitiousTransparence[] = [
  {
    candidates: 800,
    createdAt: '03/06/2026',
    label: 'Transparence annuelle 2026',
    parquetPositionsShare: 0.5,
  },
  {
    candidates: 120,
    createdAt: '07/07/2026',
    guaranteedPositions: [
      { functionId: '1AG', grade: 'G3sup', jurisdictionId: 'CA  RENNES' },
      { functionId: 'PG', grade: 'G3sup', jurisdictionId: 'CA  BORDEAUX' },
      { functionId: 'PRACO', grade: 'G3sup', jurisdictionId: 'PNACPARIS' },
      { functionId: 'PRAT', grade: 'G3sup', jurisdictionId: 'PNA PARIS' },
    ],
    label: 'Transparence PR et autres mouvements',
    parquetPositionsShare: 0.61,
  },
  {
    candidates: 60,
    createdAt: '17/06/2026',
    guaranteedPositions: [
      { functionId: '1PC', grade: 'G3sup', jurisdictionId: 'CA  LYON' },
      { functionId: '1VP', grade: 'G3', jurisdictionId: 'TJ  PARIS' },
    ],
    label: 'Transparence du siège',
    parquetPositionsShare: 0,
  },
  {
    candidates: 40,
    createdAt: '24/06/2026',
    guaranteedPositions: [
      { functionId: 'AG', grade: 'G3sup', jurisdictionId: 'CC  PARIS' },
      { functionId: 'IGJ', grade: 'G3sup', jurisdictionId: 'IGSJPARIS' },
      { functionId: 'PR F', grade: 'G3sup', jurisdictionId: 'PNF PARIS' },
      { functionId: 'PRA', grade: 'G3', jurisdictionId: 'TJ  PARIS' },
    ],
    label: 'Transparence du parquet',
    parquetPositionsShare: 1,
  },
  {
    candidates: 32,
    createdAt: '01/07/2026',
    label: 'Transparence des postes à profil',
    parquetPositionsShare: 0.5,
    profiled: true,
  },
  {
    candidates: 25,
    createdAt: '04/09/2026',
    label: 'Transparence rentrée septembre 2026',
    parquetPositionsShare: 1,
  },
  {
    candidates: 15,
    createdAt: '22/07/2026',
    guaranteedPositions: [
      {
        functionId: 'J',
        grade: 'G1',
        jurisdictionId: 'TJ  BOBIGNY',
        proposedCandidateAdministrativePosition: 'DIS',
      },
    ],
    label: 'Transparence complémentaire du siège',
    parquetPositionsShare: 0,
  },
  {
    candidates: 8,
    createdAt: '04/09/2026',
    label: 'Transparence mutation intérêt du service',
    parquetPositionsShare: 1,
  },
  {
    candidates: 3,
    createdAt: '26/08/2026',
    label: 'Transparence complémentaire du parquet',
    parquetPositionsShare: 1,
  },
];

/* The same seed gives the same magistrats, so that local and staging hold the same data */
export const FICTITIOUS_ARCHIVE_SEED = 2026;

/* Measured on the three actual transparences held by staging on 2026-10-07 */
const CANDIDATES_PER_POSITION = new Map([
  [1, 6],
  [2, 7],
  [3, 1],
  [4, 2],
  [5, 1],
  [6, 1],
  [7, 1],
  [8, 4],
  [16, 1],
  [20, 1],
  [22, 1],
]);
const DESIGNATED_CANDIDATE_RANK = new Map([
  [1, 13],
  [2, 5],
  [3, 2],
  [4, 1],
  [5, 1],
  [6, 1],
]);
const POSITIONS_WITH_A_DESIGNATED_CANDIDATE_SHARE = 23 / 26;
const PROMOTION_SHARE = 0.49;
const SAME_FORMATION_SHARE = 0.8;
const ADMINISTRATIVE_POSITIONS = new Map([
  ['PT', 232],
  ['DET', 14],
  ['PF8', 3],
  ['CPR', 1],
  ['D47-2', 1],
  ['DIS', 1],
  ['P80', 1],
  ['P90', 1],
]);
const DETACHED = 'DET';
const NOT_ASSIGNED = ['CPR', 'D47-2', 'DIS'];
const PROFILED_SHARE = 271 / 10_524;

/* The actual profiles are internal to the ministry, whereas this repository is public */
const PROFILES = [
  'Chambre sociale',
  'Mobilité de courte durée',
  'Pôle antiterroriste',
  'Pôle économique et financier',
  'Profil JIRS',
  'Profil assises',
  'Profil civil',
  'Profil financier',
  'Profil pénal',
  'Profil social',
];
const LOWER_GRADE: Record<LolfiGradeEnum, LolfiGradeEnum | undefined> = {
  G1: undefined,
  G2: 'G1',
  G3: 'G2',
  G3sup: 'G3',
};

const FIRST_SESSION_ID = 15_901;
const FIRST_MAGISTRAT_ID = 9_000_001;

export class FictitiousArchive {
  readonly #random: Random;
  readonly #referential = new LolfiReferential();
  #nextMagistratId = FIRST_MAGISTRAT_ID;

  constructor(faker: Faker) {
    this.#random = new Random(faker);
  }

  content(): LolfiArchiveContent {
    const referential = this.#referential;

    return {
      administrativePositions: referential.administrativePositions,
      functions: referential.functions,
      jurisdictions: referential.jurisdictions,
      jurisdictionTypes: referential.jurisdictionTypes,
      sessions: FICTITIOUS_TRANSPARENCES.map((transparence, index) => ({
        candidates: this.#drawCandidates(transparence),
        createdAt: transparence.createdAt,
        id: FIRST_SESSION_ID + index,
        label: transparence.label,
      })),
    };
  }

  #drawCandidates(transparence: FictitiousTransparence): FictitiousCandidate[] {
    const candidates: FictitiousCandidate[] = [];
    const targetedPositions = new Set<string>();
    const targetedFormations = new Set<LolfiFormationEnum>();
    const guaranteedPositions = [...(transparence.guaranteedPositions ?? [])];

    while (candidates.length < transparence.candidates) {
      const guaranteed = guaranteedPositions.shift();
      const targetPosition = guaranteed
        ? this.#guaranteedTargetPosition(guaranteed, targetedPositions)
        : this.#drawTargetPosition({
            formation: this.#drawFormation(transparence, targetedFormations),
            targetedPositions,
            transparence,
          });
      const formation = targetPosition.function!.formation;
      targetedFormations.add(formation);
      const size = Math.min(
        this.#random.pickWeighted(CANDIDATES_PER_POSITION),
        transparence.candidates - candidates.length,
      );
      /* A transparence without any proposition would be empty in Fondation */
      const proposing =
        !!guaranteed ||
        candidates.length === 0 ||
        this.#random.chance(POSITIONS_WITH_A_DESIGNATED_CANDIDATE_SHARE);
      const designatedRank = proposing
        ? Math.min(this.#random.pickWeighted(DESIGNATED_CANDIDATE_RANK), size)
        : undefined;

      for (let rank = 1; rank <= size; rank++) {
        const designated = rank === designatedRank;
        candidates.push(
          this.#drawCandidate({
            administrativePositionId: designated
              ? guaranteed?.proposedCandidateAdministrativePosition
              : undefined,
            designated,
            formation,
            rank,
            targetPosition,
          }),
        );
      }
    }

    return candidates;
  }

  /* A transparence meant for both formations targets each of them before drawing */
  #drawFormation(
    transparence: FictitiousTransparence,
    targetedFormations: ReadonlySet<LolfiFormationEnum>,
  ): LolfiFormationEnum {
    const share = transparence.parquetPositionsShare;
    if (share > 0 && !targetedFormations.has('PARQUET')) return 'PARQUET';
    if (share < 1 && !targetedFormations.has('SIEGE')) return 'SIEGE';
    return this.#random.chance(share) ? 'PARQUET' : 'SIEGE';
  }

  #guaranteedTargetPosition(position: GuaranteedPosition, targetedPositions: Set<string>): LolfiPosition {
    targetedPositions.add(`${position.functionId}+${position.jurisdictionId}`);

    return {
      function: this.#referential.function(position.functionId),
      grade: position.grade,
      jurisdiction: this.#referential.jurisdiction(position.jurisdictionId),
      profileId: null,
    };
  }

  #drawTargetPosition(candidacy: {
    formation: LolfiFormationEnum;
    targetedPositions: Set<string>;
    transparence: FictitiousTransparence;
  }): LolfiPosition {
    const { formation, targetedPositions, transparence } = candidacy;
    const kind = this.#random.pickWeighted(this.#referential.positionKindsWeightedByCount({ formation }));
    const jurisdiction = this.#random.pick(this.#referential.jurisdictionsOf(kind.jurisdictionType));
    const key = `${kind.functionId}+${jurisdiction.id}`;
    if (targetedPositions.has(key)) return this.#drawTargetPosition(candidacy);
    targetedPositions.add(key);

    const profiled = transparence.profiled || this.#random.chance(PROFILED_SHARE);
    return {
      function: this.#referential.function(kind.functionId),
      grade: kind.grade,
      jurisdiction,
      profile: profiled ? this.#random.pick(PROFILES) : undefined,
      profileId: null,
    };
  }

  #drawCandidate(candidacy: {
    administrativePositionId: string | undefined;
    designated: boolean;
    formation: LolfiFormationEnum;
    rank: number;
    targetPosition: LolfiPosition;
  }): FictitiousCandidate {
    const targetGrade = candidacy.targetPosition.grade!;
    const grade = this.#random.chance(PROMOTION_SHARE)
      ? (LOWER_GRADE[targetGrade] ?? targetGrade)
      : targetGrade;
    const administrativePosition = this.#referential.administrativePosition(
      candidacy.administrativePositionId ?? this.#random.pickWeighted(ADMINISTRATIVE_POSITIONS),
    );
    const position = this.#drawCurrentPosition({
      administrativePositionId: administrativePosition.id,
      formation: candidacy.formation,
      grade,
      targetPosition: candidacy.targetPosition,
    });
    const identity = drawMagistratIdentity(this.#random);
    const career = drawMagistratCareer(this.#random, this.#referential, {
      administrativePosition,
      civilite: identity.civilite,
      grade,
      position,
    });

    return {
      ...identity,
      ...career,
      administrativePosition: administrativePosition.id,
      designated: candidacy.designated,
      id: this.#nextMagistratId++,
      position,
      rank: candidacy.rank,
      targetPosition: candidacy.targetPosition,
    };
  }

  #drawCurrentPosition(magistrat: {
    administrativePositionId: string;
    formation: LolfiFormationEnum;
    grade: LolfiGradeEnum;
    targetPosition: LolfiPosition;
  }): LolfiPosition {
    const { administrativePositionId, grade } = magistrat;
    if (administrativePositionId === DETACHED) return { grade, jurisdiction: this.#referential.detachment };
    if (NOT_ASSIGNED.includes(administrativePositionId)) {
      return { grade, jurisdiction: this.#referential.noAssignment };
    }

    const otherFormation = magistrat.formation === 'PARQUET' ? 'SIEGE' : 'PARQUET';
    const formation = this.#random.chance(SAME_FORMATION_SHARE) ? magistrat.formation : otherFormation;
    const sameGradeKinds = this.#referential.positionKindsWeightedByCount({ formation, grade });
    const kind = this.#random.pickWeighted(
      sameGradeKinds.size ? sameGradeKinds : this.#referential.positionKindsWeightedByCount({ formation }),
    );

    const jurisdiction = this.#random.pick(this.#referential.jurisdictionsOf(kind.jurisdictionType));
    const { targetPosition } = magistrat;
    const holdsTheTarget =
      kind.functionId === targetPosition.function?.id && jurisdiction.id === targetPosition.jurisdiction.id;
    if (holdsTheTarget) return this.#drawCurrentPosition(magistrat);

    return { function: this.#referential.function(kind.functionId), grade, jurisdiction };
  }
}
