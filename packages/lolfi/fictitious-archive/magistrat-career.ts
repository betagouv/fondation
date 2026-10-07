import { addMonths, addYears, format, max, min, subDays, subYears } from 'date-fns';

import {
  type LolfiAdministrativePosition,
  LolfiFormationEnum,
  type LolfiGradeEnum,
  type LolfiPosition,
} from '../src';

import { type LolfiReferential } from './lolfi-referential';
import { type Civilite } from './magistrat-identity';
import { type Deciles, type Random } from './random';

export type MagistratCareer = {
  birthDate: string;
  careerHistory: string;
  gradeDate: string | undefined;
  installationDate: string | undefined;
  nominationDate: string | undefined;
};

export const REFERENCE_DATE = new Date(2026, 9, 1);

/* Measured on the magistrats held by staging on 2026-10-07, in years */
const AGE: Record<LolfiGradeEnum, Deciles> = {
  G1: [28, 35, 48],
  G2: [38, 49, 61],
  G3: [50, 59, 65],
  G3sup: [55, 62, 66],
};
const YEARS_IN_GRADE: Record<LolfiGradeEnum, Deciles> = {
  G1: [1, 4, 8],
  G2: [2, 10, 18],
  G3: [1, 4, 9],
  G3sup: [4, 9, 15],
};
const YEARS_ON_POSITION: Record<LolfiGradeEnum, Deciles> = {
  G1: [1, 2, 4],
  G2: [1, 3, 8],
  G3: [1, 3, 7],
  G3sup: [1, 3, 7],
};
const GRADE_AND_INSTALLATION_DATED_SHARE = 0.67;
const NOMINATION_DATED_SHARE = 0.98;

const GRADES = ['G1', 'G2', 'G3', 'G3sup'] as const satisfies readonly LolfiGradeEnum[];
const MINIMUM_YEARS_OF_CAREER: Record<LolfiGradeEnum, number> = { G1: 0, G2: 7, G3: 15, G3sup: 20 };

/* The reform of 2025-12-01 renamed the grades without changing their codes */
const GRADE_REFORM = new Date(2025, 11, 1);
const GRADE_LABELS = {
  AFTER_REFORM: { G1: '1er grade', G2: '2ème grade', G3: '3ème grade', G3sup: '3ème grade supérieur' },
  BEFORE_REFORM: { G1: '2ème grade', G2: '1er grade', G3: 'Hors-Hiérarchie', G3sup: 'Hors-Hiérarchie' },
} satisfies Record<string, Record<LolfiGradeEnum, string>>;

/* A LOLFI biography lists each position by function code and city:
   "- S BOBIGNY (2ème grade), 16/07/2011 (ins.01/09/2011)." */
const FIRST_GRADE_FUNCTIONS: Record<LolfiFormationEnum, readonly string[]> = {
  PARQUET: ['S', 'S', 'SP'],
  SIEGE: ['J', 'J', 'JAP', 'JE', 'JI'],
};
const HIGHER_GRADE_FUNCTIONS: Record<LolfiFormationEnum, readonly string[]> = {
  PARQUET: ['1S', 'S', 'VPR'],
  SIEGE: ['C', 'J', 'JI', 'VP'],
};
const COURT_OF_APPEAL_FUNCTIONS = ['C', 'SP'];
const SAME_FORMATION_SHARE = 0.8;
const DETACHMENTS = [
  "de l'Agence française anticorruption",
  'de la Cour pénale internationale',
  'du ministère des affaires étrangères',
];

export function drawMagistratCareer(
  random: Random,
  referential: LolfiReferential,
  magistrat: {
    administrativePosition: LolfiAdministrativePosition;
    civilite: Civilite;
    grade: LolfiGradeEnum;
    position: LolfiPosition;
  },
): MagistratCareer {
  const { civilite, grade, position } = magistrat;
  const age = Math.round(Math.min(67, Math.max(27, random.followingDeciles(AGE[grade]))));
  const birth = subDays(subYears(REFERENCE_DATE, age), random.int(0, 364));

  const latestStartAge = age - 1 - MINIMUM_YEARS_OF_CAREER[grade];
  /* A magistrat enters the first grade with the first position: an older one still there joined late */
  const firstYear =
    grade === 'G1'
      ? Math.min(
          REFERENCE_DATE.getFullYear() - 1,
          Math.max(
            birth.getFullYear() + 26,
            REFERENCE_DATE.getFullYear() - Math.round(random.followingDeciles(YEARS_IN_GRADE.G1)),
          ),
        )
      : birth.getFullYear() + random.int(26, Math.min(32, latestStartAge));
  const firstPosition = new Date(firstYear, 8, 1);
  const schoolEntry = addMonths(firstPosition, -31);
  const latest = subDays(REFERENCE_DATE, 30);

  const gradeDate =
    grade === 'G1'
      ? firstPosition
      : clamp(
          subDays(REFERENCE_DATE, random.followingDeciles(YEARS_IN_GRADE[grade]) * 365),
          addYears(firstPosition, MINIMUM_YEARS_OF_CAREER[grade]),
          latest,
        );
  const installation = clamp(
    subDays(REFERENCE_DATE, random.followingDeciles(YEARS_ON_POSITION[grade]) * 365),
    firstPosition,
    latest,
  );
  const nomination = subDays(installation, random.int(20, 60));
  const promotionDates = drawPromotionDates(random, { firstPosition, grade, gradeDate });

  function gradeAt(date: Date): LolfiGradeEnum {
    return GRADES.findLast((g) => promotionDates.has(g) && promotionDates.get(g)! <= date) ?? 'G1';
  }

  let mentionedGrade: LolfiGradeEnum | undefined;
  function gradeMention(date: Date): string | undefined {
    const reached = gradeAt(date);
    if (reached === mentionedGrade) return undefined;
    mentionedGrade = reached;
    return GRADE_LABELS[date < GRADE_REFORM ? 'BEFORE_REFORM' : 'AFTER_REFORM'][reached];
  }

  const formation = position.function?.formation ?? random.pick(Object.values(LolfiFormationEnum));
  const auditor = civilite === 'MME' ? 'Auditric Just' : 'Aud Just';
  const steps = [biographyStep(auditor, undefined, schoolEntry, schoolEntry)];

  for (let date = firstPosition; date < subYears(installation, 2); date = addYears(date, random.int(3, 6))) {
    const functions = gradeAt(date) === 'G1' ? FIRST_GRADE_FUNCTIONS : HIGHER_GRADE_FUNCTIONS;
    const code = random.pick(
      functions[random.chance(SAME_FORMATION_SHARE) ? formation : otherFormation(formation)],
    );
    const jurisdictionType = COURT_OF_APPEAL_FUNCTIONS.includes(code) ? 'CA' : 'TJ';
    const jurisdiction = random.pick(referential.jurisdictionsOf(jurisdictionType));
    const title = `${code} ${cityOf(jurisdiction.id)}`;
    steps.push(biographyStep(title, gradeMention(date), subDays(date, random.int(20, 60)), date));
  }

  if (position.jurisdiction.id === referential.detachment.id) {
    const detached = civilite === 'MME' ? 'Détachée' : 'Détaché';
    const duration = random.int(2, 5);
    steps.push(
      `- ${detached} auprès ${random.pick(DETACHMENTS)} pour une durée de ${duration} ans ${toLolfiDate(installation)}.`,
    );
  } else if (position.jurisdiction.id === referential.noAssignment.id) {
    steps.push(`- ${magistrat.administrativePosition.label} ${toLolfiDate(installation)}.`);
  } else {
    const title = `${position.function!.id} ${cityOf(position.jurisdiction.id)}`;
    steps.push(biographyStep(title, gradeMention(installation), nomination, installation));
  }

  const dated = random.chance(GRADE_AND_INSTALLATION_DATED_SHARE);
  return {
    birthDate: toLolfiDate(birth),
    careerHistory: steps.join(' '),
    gradeDate: dated ? toLolfiDate(gradeDate) : undefined,
    installationDate: dated ? toLolfiDate(installation) : undefined,
    nominationDate: random.chance(NOMINATION_DATED_SHARE) ? toLolfiDate(nomination) : undefined,
  };
}

function drawPromotionDates(
  random: Random,
  career: { firstPosition: Date; grade: LolfiGradeEnum; gradeDate: Date },
): ReadonlyMap<LolfiGradeEnum, Date> {
  const promotionDates = new Map<LolfiGradeEnum, Date>();
  for (const g of GRADES.slice(0, GRADES.indexOf(career.grade))) {
    const earliest = addYears(career.firstPosition, MINIMUM_YEARS_OF_CAREER[g] + random.int(0, 3));
    promotionDates.set(g, min([earliest, subYears(career.gradeDate, 1)]));
  }
  promotionDates.set(career.grade, career.gradeDate);
  return promotionDates;
}

function biographyStep(
  title: string,
  gradeMention: string | undefined,
  nomination: Date,
  installation: Date,
): string {
  const grade = gradeMention ? ` (${gradeMention}),` : '';
  return `- ${title}${grade} ${toLolfiDate(nomination)} (ins.${toLolfiDate(installation)}).`;
}

function cityOf(jurisdictionId: string): string {
  return jurisdictionId.match(/^\S+\s+(.+)$/)?.[1] ?? jurisdictionId;
}

function otherFormation(formation: LolfiFormationEnum): LolfiFormationEnum {
  return formation === 'PARQUET' ? 'SIEGE' : 'PARQUET';
}

function clamp(date: Date, earliest: Date, latest: Date): Date {
  return max([earliest, min([date, latest])]);
}

function toLolfiDate(date: Date): string {
  return format(date, 'dd/MM/yyyy');
}
