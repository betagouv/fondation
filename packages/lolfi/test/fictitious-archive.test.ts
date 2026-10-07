import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { faker } from '@faker-js/faker';

import {
  FICTITIOUS_ARCHIVE_SEED,
  FICTITIOUS_TRANSPARENCES,
  FictitiousArchive,
  FIRST_SYNCHRONISED_PUBLICATION,
} from '../fictitious-archive/fictitious-archive';
import { FEMALE_FIRST_NAMES, MALE_FIRST_NAMES } from '../fictitious-archive/names';
import { generateLolfiFiles } from '../src/generate-lolfi-files';
import { type LolfiArchiveContent } from '../src/types';

function fictitiousArchiveContent(): LolfiArchiveContent {
  faker.seed(FICTITIOUS_ARCHIVE_SEED);
  return new FictitiousArchive(faker).content();
}

const content = fictitiousArchiveContent();
const candidates = content.sessions.flatMap((s) => s.candidates);

function share(predicate: (c: (typeof candidates)[number]) => boolean, among = candidates): number {
  return among.filter(predicate).length / among.length;
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

  it('should hold the nine transparences under their actual names', () => {
    assert.deepStrictEqual(
      content.sessions.map((s) => [s.label, s.candidates.length]),
      FICTITIOUS_TRANSPARENCES.map((t) => [t.label, t.candidates]),
    );
  });

  it('should target the siège only, the parquet only, or both as configured', () => {
    for (const [index, transparence] of FICTITIOUS_TRANSPARENCES.entries()) {
      const formations = new Set(
        content.sessions[index]!.candidates.map((c) => c.targetPosition.function!.formation),
      );
      if (transparence.parquetPositionsShare === 0) assert.deepStrictEqual([...formations], ['SIEGE']);
      else if (transparence.parquetPositionsShare === 1) assert.deepStrictEqual([...formations], ['PARQUET']);
      else assert.strictEqual(formations.size, 2, transparence.label);
    }
  });

  it('should rank the candidates of a position and designate one at most', () => {
    for (const session of content.sessions) {
      for (const ranked of Map.groupBy(session.candidates, (c) => c.targetPosition).values()) {
        assert.deepStrictEqual(
          ranked.map((c) => c.rank),
          ranked.map((_, i) => i + 1),
        );
        assert.ok(ranked.filter((c) => c.designated).length <= 1);
      }
    }
  });

  it('should propose a candidate for each guaranteed position', () => {
    for (const [index, transparence] of FICTITIOUS_TRANSPARENCES.entries()) {
      const proposed = content.sessions[index]!.candidates.filter((c) => c.designated);

      for (const position of transparence.guaranteedPositions ?? []) {
        assert.ok(
          proposed.some(
            (c) =>
              c.targetPosition.function?.id === position.functionId &&
              c.targetPosition.jurisdiction.id === position.jurisdictionId,
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
    assert.ok(proposed.some((c) => c.position.jurisdiction.id === 'SANS AFFECTATION'));
    assert.ok(proposed.some((c) => c.marriedName));
    assert.ok(proposed.some((c) => !c.phone));
  });

  it('should follow the shares observed on staging', () => {
    const women = candidates.filter((c) => c.civilite === 'MME');
    const men = candidates.filter((c) => c.civilite === 'M.');

    assert.ok(Math.abs(share((c) => c.civilite === 'MME') - 0.72) < 0.04);
    assert.ok(Math.abs(share((c) => !!c.marriedName, women) - 0.247) < 0.04);
    assert.ok(share((c) => !!c.marriedName, men) < 0.03);
    assert.ok(Math.abs(share((c) => c.administrativePosition === 'DET') - 0.055) < 0.02);
    assert.ok(Math.abs(share((c) => !!c.phone) - 0.67) < 0.04);
  });

  it('should mostly declare married the women who bear a married name', () => {
    const women = candidates.filter((c) => c.civilite === 'MME');
    const married = (c: (typeof candidates)[number]) => c.maritalStatus === 'M';

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

    for (const c of candidates)
      assert.ok((c.civilite === 'MME' ? female : male).has(c.firstName), c.firstName);
  });

  it('should never use an actual phone number nor mailbox', () => {
    for (const c of candidates) {
      assert.match(c.email!, /@JUSTICE\.EXAMPLE$/);
      if (c.phone) assert.match(c.phone.replace(/\D/g, ''), /^(06)?3998/);
    }
  });

  it('should give an age that matches the grade', () => {
    const ages = { G1: [26, 56], G2: [33, 67], G3: [45, 67], G3sup: [50, 67] };

    for (const c of candidates) {
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

    for (const c of candidates) {
      for (const date of [c.gradeDate, c.installationDate, c.nominationDate].filter((d) => d !== undefined)) {
        const [day, month, year] = date.split('/').map(Number);
        assert.ok(Date.UTC(year!, month! - 1, day) <= reference, `${c.position.grade} ${date}`);
      }
    }
  });

  it('should write the biography as LOLFI does', () => {
    const auditor = String.raw`- (Aud|Auditric) Just \d\d/\d\d/\d{4} \(ins\.\d\d/\d\d/\d{4}\)\.`;

    for (const c of candidates) assert.match(c.careerHistory!, new RegExp(`^${auditor}( - [^-].*\\.)*$`));
  });

  it('should attach detached magistrats to no function', () => {
    for (const c of candidates.filter((c) => c.administrativePosition === 'DET')) {
      assert.strictEqual(c.position.jurisdiction.id, 'DETACHEMENT');
      assert.strictEqual(c.position.function, undefined);
    }
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
  });
});
