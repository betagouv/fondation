import { type Faker } from '@faker-js/faker';

import {
  type LolfiArchiveContent,
  type LolfiCandidate,
  LolfiFormationEnum,
  type LolfiGradeEnum,
  type LolfiJurisdiction,
  type LolfiLegacyGrade,
  type LolfiMagistrat,
  type LolfiPosition,
} from '../src';

import {
  FICTITIOUS_TRANSPARENCES,
  type FictitiousTransparence,
  type GuaranteedPosition,
} from './fictitious-transparences';
import { LolfiReferential, type PositionKind } from './lolfi-referential';
import { drawMagistratCareer, FULL_TIME } from './magistrat-career';
import { drawMagistratIdentity } from './magistrat-identity';
import { Random } from './random';

type FictitiousCandidate = LolfiCandidate;
type FictitiousMagistrat = LolfiMagistrat;

type DrawnProposition = { functionId: string; grade: LolfiGradeEnum; promotion: boolean };
type Posting = {
  position: LolfiPosition;
  propositions: { administrativePositionId?: string; promotion: boolean }[];
};

type PropositionTraits = {
  withLegacyGrade: boolean;
  withoutAssignment: boolean;
  withoutBiography: boolean;
  withoutCareerDates: boolean;
  withoutEmail: boolean;
};

/* The same seed gives the same magistrats, so that local and staging hold the same data */
export const FICTITIOUS_ARCHIVE_SEED = 2026;

const PROMOTION_SHARE = 0.49;
const SAME_FORMATION_SHARE = 0.8;
/* Production counts 2 365 magistrats transparence by transparence, for 1 736 distinct people */
const CANDIDATE_OF_AN_EARLIER_TRANSPARENCE_SHARE = 0.27;
/* The proposed magistrats of production on 2026-11-06 */
const ADMINISTRATIVE_POSITIONS = new Map([
  ['PT', 1046],
  ['DET', 24],
  ['IEC', 17],
  ['P80', 14],
  ['PF8', 11],
  ['PT5', 9],
  ['CPR', 5],
  ['D4B', 5],
  ['PT6', 4],
  ['P90', 3],
  ['D47-2', 3],
  ['D47-1', 2],
]);
const DETACHED = 'DET';
const NOT_ASSIGNED = ['CPR', 'D47-1', 'D47-2', 'D4B'];
const ASSIGNED_ADMINISTRATIVE_POSITIONS = new Map(
  [...ADMINISTRATIVE_POSITIONS].filter(([id]) => !NOT_ASSIGNED.includes(id)),
);

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

/* The corps held by production on 2026-11-06 */
const MAGISTRATS_COUNT = 10_721;
const OTHER_MAGISTRATS_GRADES = new Map<LolfiGradeEnum, number>([
  ['G1', 3491],
  ['G2', 5688],
  ['G3', 1098],
  ['G3sup', 415],
]);
const OTHER_MAGISTRATS_WITHOUT_EMAIL_SHARE = 0.008;
const OTHER_MAGISTRATS_WITHOUT_BIOGRAPHY_SHARE = 0.005;
const OTHER_MAGISTRATS_LEGACY_GRADES: readonly LolfiLegacyGrade[] = [
  ...Array<'II'>(11).fill('II'),
  'I',
  'MH',
];
const INTEGRATED = 'IEC';
/* 444 inactive magistrats in production: 441 candidate to nothing, 2 candidates and a single one proposed */
const LEAVERS_AMONG_OTHER_MAGISTRATS = 441;

const FIRST_SESSION_ID = 15_901;
const FIRST_MAGISTRAT_ID = 9_000_001;
const FIRST_NOMINATION_ID = 8_000_001;
const GRADES_FROM_THE_HIGHEST: readonly LolfiGradeEnum[] = ['G3sup', 'G3', 'G2', 'G1'];

export class FictitiousArchive {
  readonly #random: Random;
  readonly #referential = new LolfiReferential();
  readonly #magistrats: FictitiousMagistrat[] = [];
  #nextMagistratId = FIRST_MAGISTRAT_ID;
  #nextNominationId = FIRST_NOMINATION_ID;

  constructor(faker: Faker) {
    this.#random = new Random(faker);
  }

  content(): LolfiArchiveContent {
    const referential = this.#referential;
    const sessions = FICTITIOUS_TRANSPARENCES.map((transparence, index) => ({
      candidates: this.#drawCandidates(transparence, this.#drawPostings(transparence)),
      createdAt: transparence.createdAt,
      id: FIRST_SESSION_ID + index,
      label: transparence.label,
    }));

    return {
      administrativePositions: referential.administrativePositions,
      functions: referential.functions,
      jurisdictions: referential.jurisdictions,
      jurisdictionTypes: referential.jurisdictionTypes,
      magistrats: this.#drawOtherMagistrats(),
      sessions,
    };
  }

  afterDepartures(content: LolfiArchiveContent): LolfiArchiveContent {
    const candidates = content.sessions.flatMap((session) => session.candidates);
    const appliedOnce = candidates.filter(
      (candidate) => candidates.filter((c) => c.id === candidate.id).length === 1,
    );
    const proposed = appliedOnce.find((candidate) => candidate.designated)!;
    const notProposed = appliedOnce.filter((candidate) => !candidate.designated).slice(0, 2);
    const others = content.magistrats!.slice(-LEAVERS_AMONG_OTHER_MAGISTRATS);

    return {
      ...content,
      absentMagistratIds: [proposed, ...notProposed, ...others].map((magistrat) => magistrat.id!),
    };
  }

  #drawOtherMagistrats(): LolfiMagistrat[] {
    const parquetShare = this.#parquetShareOfTheCorps();
    const count = MAGISTRATS_COUNT - this.#magistrats.length;

    return Array.from({ length: count }, (_, index) =>
      this.#newMagistrat({
        formation: this.#random.chance(parquetShare) ? 'PARQUET' : 'SIEGE',
        grade: this.#random.pickWeighted(OTHER_MAGISTRATS_GRADES),
        inPlace: false,
        traits: {
          withLegacyGrade: false,
          withoutAssignment: false,
          withoutBiography: this.#random.chance(OTHER_MAGISTRATS_WITHOUT_BIOGRAPHY_SHARE),
          withoutCareerDates: false,
          withoutEmail: this.#random.chance(OTHER_MAGISTRATS_WITHOUT_EMAIL_SHARE),
        },
        ...(OTHER_MAGISTRATS_LEGACY_GRADES[index] && {
          legacyGrade: OTHER_MAGISTRATS_LEGACY_GRADES[index],
        }),
      }),
    );
  }

  #parquetShareOfTheCorps(): number {
    const posts = (formation: LolfiFormationEnum) =>
      [...this.#referential.positionKindsWeightedByCount({ formation }).values()].reduce((a, b) => a + b, 0);

    return posts('PARQUET') / (posts('PARQUET') + posts('SIEGE'));
  }

  #drawPostings(transparence: FictitiousTransparence): Posting[] {
    const occupied = new Map<string, number>();
    const guaranteedPositions = transparence.guaranteedPositions ?? [];

    const guaranteed = guaranteedPositions.map((position) => ({
      position: this.#guaranteedTargetPosition(position, occupied),
      propositions: [
        {
          administrativePositionId: position.proposedCandidateAdministrativePosition,
          promotion: this.#random.chance(PROMOTION_SHARE),
        },
      ],
    }));
    const groups = this.#groupByPosition(
      this.#drawPropositions(transparence),
      transparence.positions - transparence.positionsWithoutProposition - guaranteed.length,
      transparence.positionsWithSeveralPropositions,
    );
    const guaranteedOverseas = guaranteed.filter(({ position }) =>
      this.#referential.isOverseas(position.jurisdiction),
    ).length;
    const overseas = this.#overseasGroups(groups, transparence.propositionsOverseas - guaranteedOverseas);
    const proposed = groups.map((propositions) => ({
      position: this.#drawTargetPosition(propositions[0]!, occupied, overseas.has(propositions)),
      propositions,
    }));
    const unproposed = Array.from({ length: transparence.positionsWithoutProposition }, () => ({
      position: this.#drawTargetPosition(this.#drawUnproposedPosition(transparence), occupied, false),
      propositions: [],
    }));

    this.#giveProfiles(proposed, transparence.propositionsWithProfile);
    return [...guaranteed, ...proposed, ...unproposed];
  }

  #drawPropositions(transparence: FictitiousTransparence): DrawnProposition[] {
    const grades = this.#random.shuffle(
      Object.entries(transparence.propositionGrades).flatMap(([grade, { equivalent, promotion }]) => [
        ...Array.from({ length: equivalent }, () => ({ grade: grade as LolfiGradeEnum, promotion: false })),
        ...Array.from({ length: promotion }, () => ({ grade: grade as LolfiGradeEnum, promotion: true })),
      ]),
    );
    const left = { ...transparence.propositionsPerFormation };
    for (const { functionId } of transparence.guaranteedPositions ?? []) {
      left[this.#referential.function(functionId).formation]--;
    }

    /* The functions with the fewest possible grades choose first, or the others would leave them none */
    const requests = Object.entries(transparence.propositionFunctions)
      .map(([functionId, count]) => ({
        count,
        functionId,
        held: new Set(this.#referential.positionKindsOf(functionId).map((kind) => kind.grade)),
      }))
      .toSorted((a, b) => a.held.size - b.held.size || b.count - a.count);

    const propositions = requests.flatMap(({ count, functionId, held }, index) => {
      left[this.#referential.function(functionId).formation] -= count;
      const wantedLater = (grade: LolfiGradeEnum) =>
        requests.slice(index + 1).filter((request) => request.held.has(grade)).length;

      return Array.from({ length: count }, () => {
        const fitting = grades.filter(({ grade }) => held.has(grade));
        const drawn = fitting.length
          ? fitting.reduce((best, next) => (wantedLater(next.grade) < wantedLater(best.grade) ? next : best))
          : grades[0]!;
        grades.splice(grades.indexOf(drawn), 1);
        return { functionId, grade: drawn.grade, promotion: drawn.promotion };
      });
    });

    for (const formation of Object.values(LolfiFormationEnum)) {
      for (let drawnCount = 0; drawnCount < left[formation]; drawnCount++) {
        const drawn = grades.pop();
        if (!drawn) throw new Error(`Fewer grades than propositions in ${transparence.label}`);
        const gradeKinds = this.#referential.positionKindsWeightedByCount({ formation, grade: drawn.grade });
        const kinds = gradeKinds.size
          ? gradeKinds
          : this.#referential.positionKindsWeightedByCount({ formation });
        const kind = this.#random.pickWeighted(kinds);
        propositions.push({ functionId: kind.functionId, grade: kind.grade, promotion: drawn.promotion });
      }
    }

    return propositions;
  }

  #drawUnproposedPosition(transparence: FictitiousTransparence): DrawnProposition {
    const kind = this.#random.pickWeighted(
      this.#referential.positionKindsWeightedByCount({ formation: this.#drawFormation(transparence) }),
    );
    return { functionId: kind.functionId, grade: kind.grade, promotion: false };
  }

  #drawFormation(transparence: FictitiousTransparence): LolfiFormationEnum {
    const { PARQUET, SIEGE } = transparence.propositionsPerFormation;
    return this.#random.chance(PARQUET / (PARQUET + SIEGE)) ? 'PARQUET' : 'SIEGE';
  }

  #groupByPosition(
    propositions: readonly DrawnProposition[],
    positions: number,
    positionsWithSeveral: number,
  ): DrawnProposition[][] {
    const sameKind = [...Map.groupBy(propositions, (p) => `${p.functionId}+${p.grade}`).values()].map(
      (group) => ({ alone: [...group], shared: [] as DrawnProposition[][] }),
    );
    let merges = propositions.length - positions;

    for (let shared = 0; shared < positionsWithSeveral && merges > 0; shared++, merges--) {
      const hosts = sameKind.filter(({ alone }) => alone.length >= 2);
      if (!hosts.length) break;
      const host = this.#random.pick(hosts);
      host.shared.push(host.alone.splice(0, 2));
    }

    for (; merges > 0; merges--) {
      const hosts = sameKind.filter(({ alone, shared }) => alone.length > 0 && shared.length > 0);
      if (!hosts.length) break;
      const host = this.#random.pick(hosts);
      this.#random.pick(host.shared).push(host.alone.pop()!);
    }

    return sameKind.flatMap(({ alone, shared }) => [...alone.map((proposition) => [proposition]), ...shared]);
  }

  #overseasGroups(
    groups: readonly DrawnProposition[][],
    propositionsOverseas: number,
  ): ReadonlySet<DrawnProposition[]> {
    const overseas = new Set<DrawnProposition[]>();
    let left = propositionsOverseas;

    for (const group of this.#random.shuffle(groups)) {
      const reachable = this.#referential
        .positionKindsOf(group[0]!.functionId)
        .some((kind) => this.#referential.jurisdictionsOfSide(kind.jurisdictionType, true).length > 0);
      if (!reachable || group.length > left) continue;
      overseas.add(group);
      left -= group.length;
    }

    return overseas;
  }

  #giveProfiles(postings: readonly Posting[], propositionsWithProfile: number): void {
    const bySize = postings.toSorted((a, b) => a.propositions.length - b.propositions.length);
    let given = 0;

    for (const { position, propositions } of bySize) {
      if (given + propositions.length > propositionsWithProfile) continue;
      position.profile = this.#random.pick(PROFILES);
      given += propositions.length;
    }
  }

  #guaranteedTargetPosition(position: GuaranteedPosition, occupied: Map<string, number>): LolfiPosition {
    const key = `${position.functionId}+${position.jurisdictionId}`;
    occupied.set(key, (occupied.get(key) ?? 0) + 1);

    return {
      function: this.#referential.function(position.functionId),
      grade: position.grade,
      jurisdiction: this.#referential.jurisdiction(position.jurisdictionId),
      profileId: null,
      seat: position.seat,
    };
  }

  #drawTargetPosition(
    proposition: DrawnProposition,
    occupied: Map<string, number>,
    overseas: boolean,
  ): LolfiPosition {
    const { functionId, grade } = proposition;
    const allKinds = this.#referential.positionKindsOf(functionId);
    const sideKinds = allKinds.filter(
      (kind) => this.#referential.jurisdictionsOfSide(kind.jurisdictionType, overseas).length > 0,
    );
    const reachableKinds = sideKinds.length ? sideKinds : allKinds;
    const gradeKinds = reachableKinds.filter((kind) => kind.grade === grade);
    const kinds = gradeKinds.length ? gradeKinds : reachableKinds;
    const kind = this.#random.pickWeighted(new Map(kinds.map((k) => [k, k.count])));
    const jurisdiction = this.#drawJurisdiction(kind.jurisdictionType, overseas);

    /* Several posts of the same function in a jurisdiction are distinct posts in LOLFI */
    const key = `${functionId}+${jurisdiction.id}`;
    const alreadyOccupied = occupied.get(key) ?? 0;
    occupied.set(key, alreadyOccupied + 1);

    return {
      function: this.#referential.function(functionId),
      grade,
      jurisdiction,
      profileId: null,
      seat: alreadyOccupied ? alreadyOccupied + 1 : undefined,
    };
  }

  /* Some types of jurisdiction only exist on one side, such as the sections détachées overseas */
  #drawJurisdiction(jurisdictionType: string, overseas: boolean): LolfiJurisdiction {
    const side = this.#referential.jurisdictionsOfSide(jurisdictionType, overseas);
    return this.#random.pick(side.length ? side : this.#referential.jurisdictionsOf(jurisdictionType));
  }

  #drawPropositionTraits(transparence: FictitiousTransparence, propositions: number): PropositionTraits[] {
    const indexes = Array.from({ length: propositions }, (_, index) => index);
    const drawn = (count: number) => new Set(this.#random.shuffle(indexes).slice(0, count));
    const withoutAssignment = drawn(transparence.propositionsWithoutAssignment);
    const withoutBiography = drawn(transparence.propositionsWithoutBiography);
    const withoutCareerDates = drawn(transparence.propositionsWithoutCareerDates);
    const withoutEmail = drawn(transparence.propositionsWithoutEmail);
    const withLegacyGrade = drawn(transparence.propositionsWithLegacyGrade ?? 0);

    return indexes.map((index) => ({
      withLegacyGrade: withLegacyGrade.has(index),
      withoutAssignment: withoutAssignment.has(index),
      withoutBiography: withoutBiography.has(index),
      withoutCareerDates: withoutCareerDates.has(index),
      withoutEmail: withoutEmail.has(index),
    }));
  }

  #drawCandidates(transparence: FictitiousTransparence, postings: readonly Posting[]): FictitiousCandidate[] {
    const inSession = new Set<FictitiousMagistrat>();
    const propositionsCount = postings.flatMap(({ propositions }) => propositions).length;
    let inPlaceLeft = transparence.propositionsInPlace;
    const traits = this.#drawPropositionTraits(transparence, propositionsCount);

    const candidatesOf = new Map<Posting, { designated: boolean; magistrat: FictitiousMagistrat }[]>(
      postings.map((posting) => [
        posting,
        posting.propositions.map((proposition) => {
          const propositionTraits = traits.pop()!;
          const inPlace =
            inPlaceLeft > 0 &&
            !proposition.administrativePositionId &&
            !propositionTraits.withoutAssignment &&
            this.#canBeProposedInPlace(posting.position);
          if (inPlace) inPlaceLeft--;
          const magistrat = this.#proposedMagistrat({
            inPlace,
            inSession,
            proposition,
            targetPosition: posting.position,
            traits: propositionTraits,
          });
          inSession.add(magistrat);
          return { designated: true, magistrat };
        }),
      ]),
    );

    const unproposed = postings.filter(({ propositions }) => !propositions.length);
    const otherCandidatures = transparence.candidatures - propositionsCount;
    let otherMagistrats = transparence.magistrats - propositionsCount;

    for (let drawn = 0; drawn < otherCandidatures; drawn++) {
      const posting = unproposed[drawn] ?? this.#drawCrowdedPosting(postings);
      const proposedHere = new Set(
        candidatesOf
          .get(posting)!
          .filter(({ designated }) => designated)
          .map(({ magistrat }) => magistrat),
      );
      const magistrat = this.#otherCandidate({
        anotherMagistrat: otherMagistrats > 0,
        inSession,
        proposedHere,
        targetPosition: posting.position,
      });
      if (!inSession.has(magistrat)) otherMagistrats--;
      inSession.add(magistrat);
      candidatesOf.get(posting)!.push({ designated: false, magistrat });
    }

    const positionSorts = this.#positionSorts(postings);

    return postings.flatMap((posting) =>
      this.#random.shuffle(candidatesOf.get(posting)!).map(({ designated, magistrat }, index) => ({
        ...magistrat,
        designated,
        nominationId: this.#nextNominationId++,
        positionSort: positionSorts.get(posting),
        rank: index + 1,
        targetPosition: posting.position,
      })),
    );
  }

  /* As in production, a few positions receive dozens of candidates and most a single one */
  #drawCrowdedPosting(postings: readonly Posting[]): Posting {
    return postings[this.#random.int(0, this.#random.int(0, postings.length - 1))]!;
  }

  /* The ministry sends the positions by descending grade, then roughly by function and court */
  #positionSorts(postings: readonly Posting[]): ReadonlyMap<Posting, number> {
    const functionRanks = new Map(this.#referential.functions.map(({ id }, index) => [id, index]));
    const rankOf = ({ position }: Posting) => [
      GRADES_FROM_THE_HIGHEST.indexOf(position.grade!),
      functionRanks.get(position.function!.id)!,
    ];
    const sorted = postings.toSorted((a, b) => {
      const [gradeA, functionA] = rankOf(a);
      const [gradeB, functionB] = rankOf(b);

      return (
        gradeA! - gradeB! ||
        functionA! - functionB! ||
        a.position.jurisdiction.id.localeCompare(b.position.jurisdiction.id) ||
        (a.position.seat ?? 0) - (b.position.seat ?? 0)
      );
    });

    return new Map(sorted.map((posting, index) => [posting, index + 1]));
  }

  #canBeProposedInPlace(targetPosition: LolfiPosition): boolean {
    return this.#inPlaceKinds(targetPosition).length > 0;
  }

  #proposedMagistrat(proposed: {
    inPlace: boolean;
    inSession: ReadonlySet<FictitiousMagistrat>;
    proposition: Posting['propositions'][number];
    targetPosition: LolfiPosition;
    traits: PropositionTraits;
  }): FictitiousMagistrat {
    const { inPlace, inSession, proposition, targetPosition, traits } = proposed;
    const targetGrade = targetPosition.grade!;
    const grade = proposition.promotion ? (LOWER_GRADE[targetGrade] ?? targetGrade) : targetGrade;
    const atFullTime = inPlace || traits.withoutAssignment;
    const administrativePositionId =
      proposition.administrativePositionId ??
      (traits.withLegacyGrade ? INTEGRATED : atFullTime ? FULL_TIME : undefined);
    const lacksSomething = Object.values(traits).some(Boolean);

    /* A magistrat drawn earlier already has an assignment, a biography, dates and a mailbox:
       only a proposition that lacks none of them can reuse one */
    const earlier =
      !inPlace &&
      !administrativePositionId &&
      !lacksSomething &&
      this.#random.chance(CANDIDATE_OF_AN_EARLIER_TRANSPARENCE_SHARE)
        ? this.#magistrats.filter(
            (m) =>
              !m.legacyGrade &&
              m.careerHistory &&
              m.email &&
              m.gradeDate &&
              m.position.grade === grade &&
              m.position.jurisdiction.id !== this.#referential.noAssignment.id &&
              !inSession.has(m) &&
              !this.#holds(m, targetPosition),
          )
        : [];

    return earlier.length
      ? this.#random.pick(earlier)
      : this.#newMagistrat({
          administrativePositionId:
            administrativePositionId ?? this.#random.pickWeighted(ASSIGNED_ADMINISTRATIVE_POSITIONS),
          dated: !traits.withoutCareerDates,
          formation: targetPosition.function!.formation,
          grade,
          inPlace,
          ...(traits.withLegacyGrade && { legacyGrade: 'II' as const }),
          targetPosition,
          traits,
        });
  }

  /* A candidate may apply twice to a position as in production, but never one proposed on it */
  #otherCandidate(candidate: {
    anotherMagistrat: boolean;
    inSession: ReadonlySet<FictitiousMagistrat>;
    proposedHere: ReadonlySet<FictitiousMagistrat>;
    targetPosition: LolfiPosition;
  }): FictitiousMagistrat {
    const { anotherMagistrat, inSession, proposedHere, targetPosition } = candidate;
    const targetGrade = targetPosition.grade!;
    const grade = this.#random.chance(PROMOTION_SHARE)
      ? (LOWER_GRADE[targetGrade] ?? targetGrade)
      : targetGrade;
    const among = anotherMagistrat
      ? this.#random.chance(CANDIDATE_OF_AN_EARLIER_TRANSPARENCE_SHARE)
        ? this.#magistrats.filter((m) => !inSession.has(m))
        : []
      : [...inSession];
    const fitting = among.filter(
      (m) => m.position.grade === grade && !proposedHere.has(m) && !this.#holds(m, targetPosition),
    );

    return fitting.length
      ? this.#random.pick(fitting)
      : this.#newMagistrat({
          formation: targetPosition.function!.formation,
          grade,
          inPlace: false,
          targetPosition,
        });
  }

  #holds(magistrat: FictitiousMagistrat, targetPosition: LolfiPosition): boolean {
    return (
      magistrat.position.function?.id === targetPosition.function?.id &&
      magistrat.position.jurisdiction.id === targetPosition.jurisdiction.id
    );
  }

  #newMagistrat(magistrat: {
    administrativePositionId?: string;
    dated?: boolean;
    formation: LolfiFormationEnum;
    grade: LolfiGradeEnum;
    inPlace: boolean;
    legacyGrade?: LolfiLegacyGrade;
    targetPosition?: LolfiPosition;
    traits?: PropositionTraits;
  }): FictitiousMagistrat {
    const { dated, formation, grade, inPlace, legacyGrade, targetPosition, traits } = magistrat;
    const administrativePosition = this.#referential.administrativePosition(
      magistrat.administrativePositionId ?? this.#random.pickWeighted(ADMINISTRATIVE_POSITIONS),
    );
    const position = this.#drawCurrentPosition({
      administrativePositionId: administrativePosition.id,
      formation,
      grade,
      inPlace,
      targetPosition,
      withoutAssignment: !!traits?.withoutAssignment,
    });
    const identity = drawMagistratIdentity(this.#random);
    const career = drawMagistratCareer(this.#random, this.#referential, {
      administrativePosition,
      civilite: identity.civilite,
      dated,
      grade,
      position,
    });
    const drawn: FictitiousMagistrat = {
      ...identity,
      ...career,
      administrativePosition: administrativePosition.id,
      careerHistory: traits?.withoutBiography ? undefined : career.careerHistory,
      email: traits?.withoutEmail ? null : identity.email,
      id: this.#nextMagistratId++,
      ...(legacyGrade && { legacyGrade }),
      position,
    };

    this.#magistrats.push(drawn);
    return drawn;
  }

  #inPlaceKinds(targetPosition: LolfiPosition) {
    const { function: targetFunction, jurisdiction } = targetPosition;

    return this.#referential
      .positionKindsOfJurisdictionType(jurisdiction.jurisdictionType!)
      .filter(
        (kind) =>
          kind.functionId !== targetFunction?.id &&
          this.#referential.function(kind.functionId).formation === targetFunction?.formation,
      );
  }

  #drawCurrentPosition(magistrat: {
    administrativePositionId: string;
    formation: LolfiFormationEnum;
    grade: LolfiGradeEnum;
    inPlace: boolean;
    targetPosition?: LolfiPosition;
    withoutAssignment: boolean;
  }): LolfiPosition {
    const { administrativePositionId, grade, inPlace, targetPosition, withoutAssignment } = magistrat;
    if (administrativePositionId === DETACHED) return { grade, jurisdiction: this.#referential.detachment };
    if (withoutAssignment || NOT_ASSIGNED.includes(administrativePositionId)) {
      return { grade, jurisdiction: this.#referential.noAssignment };
    }

    if (inPlace) {
      const kinds = this.#inPlaceKinds(targetPosition!);
      const sameGrade = kinds.filter((kind) => kind.grade === grade);
      const kind = this.#random.pickWeighted(
        new Map((sameGrade.length ? sameGrade : kinds).map((k) => [k, k.count])),
      );
      return this.#heldPosition(kind.functionId, grade, targetPosition!.jurisdiction);
    }

    const otherFormation = magistrat.formation === 'PARQUET' ? 'SIEGE' : 'PARQUET';
    const formation = this.#random.chance(SAME_FORMATION_SHARE) ? magistrat.formation : otherFormation;
    /* The transparence alone decides who is overseas: kinds of jurisdiction that only exist there are excluded */
    const metropolitan = (kinds: ReadonlyMap<PositionKind, number>) =>
      new Map(
        [...kinds].filter(
          ([kind]) => this.#referential.jurisdictionsOfSide(kind.jurisdictionType, false).length > 0,
        ),
      );
    const sameGradeKinds = metropolitan(this.#referential.positionKindsWeightedByCount({ formation, grade }));
    const kind = this.#random.pickWeighted(
      sameGradeKinds.size
        ? sameGradeKinds
        : metropolitan(this.#referential.positionKindsWeightedByCount({ formation })),
    );

    const jurisdiction = this.#drawJurisdiction(kind.jurisdictionType, false);
    const holdsTheTarget =
      kind.functionId === targetPosition?.function?.id && jurisdiction.id === targetPosition?.jurisdiction.id;
    if (holdsTheTarget) return this.#drawCurrentPosition(magistrat);

    return this.#heldPosition(kind.functionId, grade, jurisdiction);
  }

  #heldPosition(functionId: string, grade: LolfiGradeEnum, jurisdiction: LolfiJurisdiction): LolfiPosition {
    return { function: this.#referential.function(functionId), grade, jurisdiction };
  }
}
