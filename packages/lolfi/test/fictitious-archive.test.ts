import assert from 'node:assert/strict';

import { faker } from '@faker-js/faker';
import { describe, it } from 'vitest';

import { FICTITIOUS_ARCHIVE_SEED, FictitiousArchive } from '../fictitious-archive/fictitious-archive';
import {
  FICTITIOUS_TRANSPARENCES,
  FIRST_SYNCHRONISED_PUBLICATION,
} from '../fictitious-archive/fictitious-transparences';
import { LolfiReferential } from '../fictitious-archive/lolfi-referential';
import { FEMALE_FIRST_NAMES, MALE_FIRST_NAMES } from '../fictitious-archive/names';
import { generateLolfiFiles } from '../src/generate-lolfi-files';
import { type LolfiArchiveContent } from '../src/types';

function fictitiousArchiveContent(): LolfiArchiveContent {
  faker.seed(FICTITIOUS_ARCHIVE_SEED);
  return new FictitiousArchive(faker).content();
}

const content = fictitiousArchiveContent();
const candidates = content.sessions.flatMap((s) => s.candidates);
const magistrats = [...new Map(candidates.map((c) => [c.id, c])).values()];

type Candidate = (typeof candidates)[number];

function share(predicate: (c: Candidate) => boolean, among: readonly Candidate[] = magistrats): number {
  return among.filter(predicate).length / among.length;
}

function sessionsWithTransparences() {
  return FICTITIOUS_TRANSPARENCES.map((transparence, index) => ({
    session: content.sessions[index]!,
    transparence,
  }));
}

describe('fictitious archive', () => {
  it('should be the same at each generation', () => {
    assert.deepStrictEqual(fictitiousArchiveContent(), content);
  });

  it('should publish every transparence late enough for staging to synchronise it', () => {
    const toTime = (date: string) => {
      const [day, month, year] = date.split('/').map(Number);
      return Date.UTC(year!, month! - 1, day);
    };

    for (const transparence of FICTITIOUS_TRANSPARENCES) {
      assert.ok(toTime(transparence.createdAt) >= toTime(FIRST_SYNCHRONISED_PUBLICATION), transparence.label);
    }
  });

  it('should hold the candidatures of each transparence of production', () => {
    assert.deepStrictEqual(
      content.sessions.map((s) => [s.label, s.candidates.length]),
      FICTITIOUS_TRANSPARENCES.map((t) => [t.label, t.candidatures]),
    );
  });

  it('should propose as many magistrats per formation as production', () => {
    for (const { session, transparence } of sessionsWithTransparences()) {
      const proposed = session.candidates.filter((c) => c.designated);
      const count = (formation: string) =>
        proposed.filter((c) => c.targetPosition.function!.formation === formation).length;

      assert.deepStrictEqual(
        { PARQUET: count('PARQUET'), SIEGE: count('SIEGE') },
        transparence.propositionsPerFormation,
        transparence.label,
      );
    }
  });

  it('should spread the propositions over as many positions as production', async () => {
    const files = new Map<string, string>();
    for await (const file of generateLolfiFiles(content, faker)) files.set(file.filename, file.buffer);
    const written = (name: string, tag: string) =>
      [...files.get(name)!.matchAll(new RegExp(`<${tag}>([^<]+)</${tag}>`, 'g'))].map((m) => m[1]);
    const writtenTargets = written('TRANSPARENCES.xml', 'num_emploi_cible');
    const writtenSessions = written('TRANSPARENCES.xml', 'num_session');

    for (const { session, transparence } of sessionsWithTransparences()) {
      const designatedPerPosition = [
        ...Map.groupBy(session.candidates, (c) => c.targetPosition).values(),
      ].map((ranked) => ranked.filter((c) => c.designated).length);

      assert.strictEqual(
        new Set(writtenTargets.filter((_, index) => writtenSessions[index] === String(session.id))).size,
        transparence.positions,
        transparence.label,
      );

      assert.strictEqual(designatedPerPosition.length, transparence.positions, transparence.label);
      assert.strictEqual(
        designatedPerPosition.filter((count) => count === 0).length,
        transparence.positionsWithoutProposition,
        transparence.label,
      );
      assert.strictEqual(
        designatedPerPosition.filter((count) => count > 1).length,
        transparence.positionsWithSeveralPropositions,
        transparence.label,
      );
    }
  });

  it('should keep the auditors on the first grade', () => {
    const auditors = content.sessions[0]!.candidates.filter((c) => c.designated);

    assert.ok(auditors.every((c) => c.targetPosition.grade === 'G1'));
  });

  it('should keep the transparences of a single kind of position to their functions', () => {
    const functions = (label: string) => [
      ...new Set(
        content.sessions
          .find((s) => s.label === label)!
          .candidates.filter((c) => c.designated)
          .map((c) => c.targetPosition.function!.id),
      ),
    ];

    assert.deepStrictEqual(functions('Transparence PG-PR de printemps').toSorted(), ['PG', 'PR']);
    assert.deepStrictEqual(functions('Transparence mutation intérêt du service'), ['SG']);
  });

  it('should give a profile to as many propositions as production', () => {
    for (const { session, transparence } of sessionsWithTransparences()) {
      const proposed = session.candidates.filter((c) => c.designated);

      assert.strictEqual(
        proposed.filter((c) => c.targetPosition.profile).length,
        transparence.propositionsWithProfile,
        transparence.label,
      );
    }
  });

  it('should propose in their own jurisdiction about as many magistrats as production', () => {
    for (const { session, transparence } of sessionsWithTransparences()) {
      const inPlace = session.candidates.filter(
        (c) => c.designated && c.position.jurisdiction.id === c.targetPosition.jurisdiction.id,
      ).length;

      assert.ok(
        Math.abs(inPlace - transparence.propositionsInPlace) <= 3,
        `${transparence.label}: ${inPlace}`,
      );
    }
  });

  it('should hold about as many distinct magistrats as production', () => {
    for (const { session, transparence } of sessionsWithTransparences()) {
      const distinct = new Set(session.candidates.map((c) => c.id)).size;

      assert.ok(
        Math.abs(distinct - transparence.magistrats) <= transparence.magistrats * 0.1 + 1,
        `${transparence.label}: ${distinct}`,
      );
    }
  });

  it('should bring back magistrats from one transparence to another', () => {
    const sessionsPerMagistrat = Map.groupBy(candidates, (c) => c.id);
    const inSeveralSessions = [...sessionsPerMagistrat.values()].filter(
      (nominations) =>
        new Set(nominations.map((n) => content.sessions.findIndex((s) => s.candidates.includes(n)))).size > 1,
    );

    assert.ok(inSeveralSessions.length > 100, `${inSeveralSessions.length}`);
  });

  it('should only apply twice to a position as a magistrat who is not proposed on it', () => {
    const doubles = content.sessions.flatMap((session) =>
      [...Map.groupBy(session.candidates, (c) => c.targetPosition).values()].flatMap((ranked) =>
        [...Map.groupBy(ranked, (c) => c.id).values()].filter((same) => same.length > 1),
      ),
    );

    assert.ok(doubles.length > 0);
    assert.deepStrictEqual(
      doubles.filter((same) => same.some((c) => c.designated)),
      [],
    );
  });

  it('should spell out as many grades as propositions per formation', () => {
    for (const transparence of FICTITIOUS_TRANSPARENCES) {
      const grades = Object.values(transparence.propositionGrades).reduce(
        (sum, { equivalent, promotion }) => sum + equivalent + promotion,
        0,
      );
      const { PARQUET, SIEGE } = transparence.propositionsPerFormation;

      assert.strictEqual(grades, PARQUET + SIEGE, transparence.label);
    }
  });

  it('should never propose a magistrat twice in a transparence', () => {
    for (const session of content.sessions) {
      const proposed = session.candidates.filter((c) => c.designated).map((c) => c.id);

      assert.strictEqual(new Set(proposed).size, proposed.length);
    }
  });

  it('should number each candidature apart from its magistrat', () => {
    assert.strictEqual(new Set(candidates.map((c) => c.nominationId)).size, candidates.length);
  });

  it('should rank the candidates of a position', () => {
    for (const session of content.sessions) {
      for (const ranked of Map.groupBy(session.candidates, (c) => c.targetPosition).values()) {
        assert.deepStrictEqual(
          ranked.map((c) => c.rank),
          ranked.map((_, i) => i + 1),
        );
      }
    }
  });

  it('should leave without biography, dates or mailbox as many propositions as production', () => {
    for (const { session, transparence } of sessionsWithTransparences()) {
      const proposed = session.candidates.filter((c) => c.designated);

      assert.deepStrictEqual(
        {
          biography: proposed.filter((c) => !c.careerHistory).length,
          dates: proposed.filter((c) => !c.gradeDate && !c.installationDate).length,
          email: proposed.filter((c) => !c.email).length,
        },
        {
          biography: transparence.propositionsWithoutBiography,
          dates: transparence.propositionsWithoutCareerDates,
          email: transparence.propositionsWithoutEmail,
        },
        transparence.label,
      );
    }
  });

  it('should leave unassigned about as many propositions as production', () => {
    for (const { session, transparence } of sessionsWithTransparences()) {
      const unassigned = session.candidates.filter(
        (c) => c.designated && c.position.jurisdiction.id === 'SANS AFFECTATION',
      ).length;
      const expected = transparence.propositionsWithoutAssignment;

      assert.ok(Math.abs(unassigned - expected) <= 5, `${transparence.label}: ${unassigned}`);
    }
  });

  it('should propose overseas about as many magistrats as production', () => {
    const overseas = (jurisdiction: { id: string; postalCode?: string }) =>
      /^9[78]\d{3}/.test(jurisdiction.postalCode ?? '') ||
      /(CAYENNE|MAMOUDZOU|SAINT MARTIN|SAINT LAURENT DU MARONI)$/.test(jurisdiction.id);

    for (const { session, transparence } of sessionsWithTransparences()) {
      const count = session.candidates.filter(
        (c) => c.designated && (overseas(c.targetPosition.jurisdiction) || overseas(c.position.jurisdiction)),
      ).length;

      assert.ok(Math.abs(count - transparence.propositionsOverseas) <= 3, `${transparence.label}: ${count}`);
    }
  });

  it('should hold names with an apostrophe', () => {
    assert.ok(magistrats.some((c) => c.lastName.includes("'")));
  });

  it('should only propose a function at a grade it has', () => {
    const referential = new LolfiReferential();

    for (const { session, transparence } of sessionsWithTransparences()) {
      const guaranteed = new Set(transparence.guaranteedPositions?.map((p) => p.functionId));
      const impossible = session.candidates
        .filter((c) => c.designated && !guaranteed.has(c.targetPosition.function!.id))
        .filter(
          ({ targetPosition: { function: f, grade } }) =>
            !referential.positionKindsOf(f!.id).some((kind) => kind.grade === grade),
        )
        .map((c) => `${c.targetPosition.function!.id} ${c.targetPosition.grade}`);

      assert.deepStrictEqual(impossible, [], transparence.label);
    }
  });

  it('should sort the positions by descending grade, those of a position following one another', () => {
    const gradeOrder = ['G3sup', 'G3', 'G2', 'G1'];

    for (const session of content.sessions) {
      const sorted = session.candidates.toSorted((a, b) => a.positionSort! - b.positionSort!);
      const grades = sorted.map((c) => gradeOrder.indexOf(c.targetPosition.grade!));
      const positions = sorted.map((c) => c.targetPosition);

      assert.deepStrictEqual(
        grades,
        grades.toSorted((a, b) => a - b),
      );
      assert.strictEqual(
        positions.filter((position, index) => position !== positions[index - 1]).length,
        new Set(positions).size,
      );
    }
  });

  it('should propose a candidate for each guaranteed position', () => {
    for (const { session, transparence } of sessionsWithTransparences()) {
      const proposed = session.candidates.filter((c) => c.designated);

      for (const position of transparence.guaranteedPositions ?? []) {
        assert.ok(
          proposed.some(
            (c) =>
              c.targetPosition.function?.id === position.functionId &&
              c.targetPosition.grade === position.grade &&
              c.targetPosition.jurisdiction.id === position.jurisdictionId &&
              (!position.proposedCandidateAdministrativePosition ||
                c.administrativePosition === position.proposedCandidateAdministrativePosition),
          ),
          `${position.functionId} ${position.jurisdictionId}`,
        );
      }
    }
  });

  it('should give dossiers every case the application treats apart', () => {
    const proposed = candidates.filter((c) => c.designated);
    const overseas = (postalCode?: string) => /^9[78]/.test(postalCode ?? '');

    assert.ok(proposed.some((c) => overseas(c.targetPosition.jurisdiction.postalCode)));
    assert.ok(proposed.some((c) => c.targetPosition.profile));
    assert.ok(proposed.some((c) => c.administrativePosition === 'DET'));
    assert.ok(proposed.some((c) => c.administrativePosition === 'CPR'));
    assert.ok(proposed.some((c) => c.position.jurisdiction.id === 'SANS AFFECTATION'));
    assert.ok(proposed.some((c) => c.marriedName));
    assert.ok(proposed.some((c) => !c.phone));
  });

  it('should follow the shares observed on staging', () => {
    const women = magistrats.filter((c) => c.civilite === 'MME');
    const men = magistrats.filter((c) => c.civilite === 'M.');

    assert.ok(Math.abs(share((c) => c.civilite === 'MME') - 0.72) < 0.04);
    assert.ok(Math.abs(share((c) => !!c.marriedName, women) - 0.247) < 0.04);
    assert.ok(share((c) => !!c.marriedName, men) < 0.03);
    assert.ok(Math.abs(share((c) => c.administrativePosition === 'DET') - 0.021) < 0.02);
    assert.ok(Math.abs(share((c) => !!c.phone) - 0.67) < 0.04);
  });

  it('should mostly declare married the women who bear a married name', () => {
    const women = magistrats.filter((c) => c.civilite === 'MME');
    const married = (c: Candidate) => c.maritalStatus === 'M';

    assert.ok(
      share(
        married,
        women.filter((c) => c.marriedName),
      ) > 0.75,
    );
    assert.ok(
      share(
        married,
        women.filter((c) => !c.marriedName),
      ) < 0.2,
    );
  });

  it('should give a first name that matches the civilité', () => {
    const female = new Set<string>(FEMALE_FIRST_NAMES);
    const male = new Set<string>(MALE_FIRST_NAMES);

    for (const c of magistrats) {
      assert.ok((c.civilite === 'MME' ? female : male).has(c.firstName), c.firstName);
    }
  });

  it('should never use an actual phone number nor mailbox', () => {
    for (const c of magistrats) {
      if (c.email) assert.match(c.email, /@JUSTICE\.EXAMPLE$/);
      if (c.phone) assert.match(c.phone.replace(/\D/g, ''), /^(06)?3998/);
    }
  });

  it('should give an age that matches the grade', () => {
    const ages = { G1: [26, 56], G2: [33, 67], G3: [45, 67], G3sup: [50, 67] };

    for (const c of magistrats) {
      const [day, month, year] = c.birthDate!.split('/').map(Number);
      const age = (Date.UTC(2026, 9, 1) - Date.UTC(year!, month! - 1, day)) / (365.25 * 24 * 3600 * 1000);
      const [youngest, oldest] = ages[c.position.grade!];
      assert.ok(age >= youngest! && age <= oldest! + 1, `${c.position.grade} at ${age}`);
    }
  });

  it('should never let a magistrat target the position held', () => {
    const holdingTheTarget = candidates.filter(
      (c) =>
        c.position.function?.id === c.targetPosition.function?.id &&
        c.position.jurisdiction.id === c.targetPosition.jurisdiction.id,
    );

    assert.deepStrictEqual(holdingTheTarget, []);
  });

  it('should date no career event after the reference date', () => {
    const reference = Date.UTC(2026, 9, 1);

    for (const c of magistrats) {
      for (const date of [c.gradeDate, c.installationDate, c.nominationDate].filter((d) => d !== undefined)) {
        const [day, month, year] = date.split('/').map(Number);
        assert.ok(Date.UTC(year!, month! - 1, day) <= reference, `${c.position.grade} ${date}`);
      }
    }
  });

  it('should write the biography as LOLFI does', () => {
    const auditor = String.raw`- (Aud|Auditric) Just \d\d/\d\d/\d{4} \(ins\.\d\d/\d\d/\d{4}\)\.`;

    for (const c of magistrats.filter((c) => c.careerHistory)) {
      assert.match(c.careerHistory!, new RegExp(`^${auditor}( - [^-].*\\.)*$`));
    }
  });

  it('should attach detached magistrats to no function', () => {
    for (const c of magistrats.filter((c) => c.administrativePosition === 'DET')) {
      assert.strictEqual(c.position.jurisdiction.id, 'DETACHEMENT');
      assert.strictEqual(c.position.function, undefined);
    }
  });

  it('should hold the whole corps of production, most of it candidate to nothing', () => {
    const others = content.magistrats!;
    const ids = new Set([...magistrats, ...others].map((m) => m.id));

    assert.strictEqual(ids.size, 10_721);
    assert.ok(others.every((m) => !magistrats.some((c) => c.id === m.id)));
    assert.ok(others.some((m) => !m.email));
    assert.ok(others.some((m) => !m.careerHistory));
  });

  it('should give a few magistrats the grades of before the reform', () => {
    const legacy = [...magistrats, ...content.magistrats!].filter((m) => m.legacyGrade);

    assert.deepStrictEqual(
      Object.fromEntries(
        [...Map.groupBy(legacy, (m) => m.legacyGrade).entries()].map(([grade, list]) => [grade, list.length]),
      ),
      { I: 1, II: 27, MH: 1 },
    );
  });

  it('should write the grades of before the reform so that the ingestion knows them', async () => {
    const files = new Map<string, string>();
    for await (const file of generateLolfiFiles(content, faker)) files.set(file.filename, file.buffer);

    for (const grade of ['I', 'II', 'MH']) {
      assert.match(files.get('GRADES.xml')!, new RegExp(`<grade>${grade}</grade>`));
      assert.match(files.get('MAGISTRATS.xml')!, new RegExp(`<grade>${grade}</grade>`));
    }
  });

  it('should only differ by the magistrats who left in the archive of the next import', async () => {
    const filesOf = async (departures: boolean) => {
      faker.seed(FICTITIOUS_ARCHIVE_SEED);
      const archive = new FictitiousArchive(faker);
      const drawn = archive.content();
      const files = new Map<string, string>();
      for await (const file of generateLolfiFiles(
        departures ? archive.afterDepartures(drawn) : drawn,
        faker,
      )) {
        files.set(file.filename, file.buffer);
      }
      return files;
    };
    const first = await filesOf(false);
    const next = await filesOf(true);
    const ids = (files: Map<string, string>) =>
      [...files.get('MAGISTRATS.xml')!.matchAll(/<id>(\d+)<\/id>/g)].map((m) => m[1]);

    for (const [name, buffer] of first) {
      if (name !== 'MAGISTRATS.xml') assert.strictEqual(next.get(name), buffer, name);
    }
    assert.strictEqual(ids(first).length - ids(next).length, 444);
    assert.ok(new Set(ids(first)).isSupersetOf(new Set(ids(next))));
  });

  it('should keep the nominations of a proposed magistrat who left', () => {
    faker.seed(FICTITIOUS_ARCHIVE_SEED);
    const archive = new FictitiousArchive(faker);
    const drawn = archive.content();
    const absent = new Set(archive.afterDepartures(drawn).absentMagistratIds);
    const nominations = drawn.sessions.flatMap((s) => s.candidates).filter((c) => absent.has(c.id!));

    assert.strictEqual(nominations.filter((c) => c.designated).length, 1);
    assert.strictEqual(nominations.length, 3);
  });

  it('should produce files the ingestion accepts', async () => {
    const files = new Map<string, string>();
    for await (const file of generateLolfiFiles(content, faker)) files.set(file.filename, file.buffer);

    const jurisdictions = files.get('JURIDICTIONS.xml')!;
    const written = [
      ...jurisdictions.matchAll(/<codejur>([^<]+)<\/codejur>[\s\S]*?<libelle>([^<]+)<\/libelle>/g),
    ];
    assert.deepStrictEqual(
      written.map(([, id, label]) => `${id} ${label?.replaceAll('&amp;', '&')}`).sort(),
      content.jurisdictions!.map((j) => `${j.id} ${j.label}`).sort(),
    );
    assert.doesNotMatch(jurisdictions, /<ville_jur><\/ville_jur>|cour d'appel \+/);
    assert.doesNotMatch(files.get('SESSIONS.xml')!, /\(\d+\)<\/libelle>/);
    assert.match(
      files.get('POSADS.xml')!,
      /<posad>DET<\/posad>\n<libelle>Détachement<\/libelle>\n<reel>0<\/reel>/,
    );
    assert.match(
      files.get('POSADS.xml')!,
      /<posad>P80<\/posad>\n<libelle>[^<]+<\/libelle>\n<reel>0,8<\/reel>/,
    );

    const ressorts = new Set([...jurisdictions.matchAll(/<ressort>([^<]+)<\/ressort>/g)].map((m) => m[1]));
    const codes = new Set([...jurisdictions.matchAll(/<codejur>([^<]+)<\/codejur>/g)].map((m) => m[1]));
    assert.deepStrictEqual(
      [...ressorts].filter((r) => !codes.has(r)),
      [],
    );

    const unique = (file: string, tag: string) => {
      const values = [...files.get(file)!.matchAll(new RegExp(`<${tag}>([^<]+)</${tag}>`, 'g'))].map(
        (m) => m[1],
      );
      assert.strictEqual(new Set(values).size, values.length, `${file} ${tag}`);
    };
    unique('MAGISTRATS.xml', 'id');
    unique('CANDIDATS.xml', 'num_candidat');
    unique('POSTES_2.xml', 'num_emploi_cible');
    unique('TRANSPARENCES.xml', 'num_transparence');
  });
});
