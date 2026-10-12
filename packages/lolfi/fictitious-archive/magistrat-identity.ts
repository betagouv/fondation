import { FEMALE_FIRST_NAMES, LAST_NAMES, MALE_FIRST_NAMES } from './names';
import { type Random } from './random';

export type Civilite = 'M.' | 'MME';

export type MagistratIdentity = {
  civilite: Civilite;
  email: string;
  firstName: string;
  lastName: string;
  maritalStatus: string | null;
  marriedName: string | undefined;
  phone: string | undefined;
  usedName: string | undefined;
};

/* Shares and phone formats measured on the 10 375 magistrats held by staging on 2026-10-07 */
const WOMEN_SHARE = 0.72;
const MARRIED_NAME_SHARE: Record<Civilite, number> = { 'M.': 0.007, MME: 0.247 };
const NO_USED_NAME_SHARE: Record<Civilite, number> = { 'M.': 0.016, MME: 0.011 };
const MARRIED_NAME_AS_USED_NAME_SHARE: Record<Civilite, number> = { 'M.': 0.1, MME: 0.446 };
const COMPOUND_USED_NAME_SHARE: Record<Civilite, number> = { 'M.': 0.009, MME: 0.061 };
/* Measured on 10 720 magistrats held by production on 2026-10-07: a married name does not imply a married status */
const MARITAL_STATUSES: Record<
  Civilite,
  Record<'withMarriedName' | 'withoutMarriedName', Map<string | null, number>>
> = {
  'M.': {
    withMarriedName: new Map<string | null, number>([
      ['C', 8],
      ['M', 10],
      ['P', 1],
    ]),
    withoutMarriedName: new Map<string | null, number>([
      ['C', 1373],
      ['D', 62],
      ['I', 127],
      ['M', 1112],
      ['P', 178],
      ['S', 6],
      ['U', 133],
      ['V', 5],
      [null, 7],
    ]),
  },
  MME: {
    withMarriedName: new Map<string | null, number>([
      ['C', 112],
      ['D', 63],
      ['I', 33],
      ['M', 1729],
      ['P', 8],
      ['S', 6],
      ['U', 13],
      ['V', 11],
    ]),
    withoutMarriedName: new Map<string | null, number>([
      ['C', 3774],
      ['D', 330],
      ['I', 204],
      ['M', 550],
      ['P', 465],
      ['S', 24],
      ['U', 363],
      ['V', 2],
      [null, 11],
    ]),
  },
};
const PHONE_SHARE = 0.67;
const PHONE_FORMATS = new Map<(digits: string) => string, number>([
  [(d) => d, 6701],
  [(d) => d.slice(2).replace(/(\d\d)(?=\d)/g, '$1 '), 79],
  [(d) => `${d}5`, 39],
  [(d) => d.slice(2).replace(/(\d\d)/g, '$1.'), 39],
  [(d) => d.slice(2).replace(/(\d\d)/g, '$1-'), 7],
  [(d) => d.slice(0, 9), 6],
]);
const FICTION_PHONE_PREFIX = '063998';

export function drawMagistratIdentity(random: Random): MagistratIdentity {
  const civilite = random.chance(WOMEN_SHARE) ? 'MME' : 'M.';
  const firstName = random.pick(civilite === 'MME' ? FEMALE_FIRST_NAMES : MALE_FIRST_NAMES);
  const lastName = random.pick(LAST_NAMES);
  const marriedName = random.chance(MARRIED_NAME_SHARE[civilite])
    ? anotherLastName(random, lastName)
    : undefined;
  const usedName = drawUsedName(random, { civilite, lastName, marriedName });
  const phoneDigits = `${FICTION_PHONE_PREFIX}${random.int(1000, 9999)}`;

  return {
    civilite,
    /* A reserved domain, so that no message can ever reach an actual mailbox */
    email: `${toEmailPart(firstName)}.${toEmailPart(usedName ?? lastName)}@JUSTICE.EXAMPLE`,
    firstName,
    lastName,
    maritalStatus: random.pickWeighted(
      MARITAL_STATUSES[civilite][marriedName ? 'withMarriedName' : 'withoutMarriedName'],
    ),
    marriedName,
    phone: random.chance(PHONE_SHARE) ? random.pickWeighted(PHONE_FORMATS)(phoneDigits) : undefined,
    usedName,
  };
}

function drawUsedName(
  random: Random,
  magistrat: { civilite: Civilite; lastName: string; marriedName: string | undefined },
): string | undefined {
  const { civilite, lastName, marriedName } = magistrat;
  if (random.chance(NO_USED_NAME_SHARE[civilite])) return undefined;
  if (marriedName && random.chance(MARRIED_NAME_AS_USED_NAME_SHARE[civilite])) return marriedName;
  if (random.chance(COMPOUND_USED_NAME_SHARE[civilite]))
    return `${lastName}-${anotherLastName(random, lastName)}`;
  return lastName;
}

function anotherLastName(random: Random, lastName: string): string {
  const name = random.pick(LAST_NAMES);
  return name === lastName ? anotherLastName(random, lastName) : name;
}

function toEmailPart(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replaceAll(' ', '-')
    .toUpperCase();
}
