import { Magistrat } from 'shared-models';

import { FormationEnum } from 'src/modules/shared/formation.enum';
import { DateOnly } from 'src/utils/date-only';

import { AffectableMember, AutoAffectationMember } from './auto-affectation-member';
import { AutoAffectationNominationFile } from './auto-affectation-nomination-file';

describe('auto affectation member', () => {
  const session: { date: DateOnly; formation: FormationEnum } = {
    date: DateOnly.fromJson({ day: 1, month: 1, year: 2026 }),
    formation: 'SIEGE',
  };

  it('should sort members', () => {
    // oxfmt-ignore
    const members = [
      AutoAffectationMember.from({ session, id: 'member-1', excludedJurisdictions: new Set(), affectationCountPerGrade: new Map([[Magistrat.Grade.G1, 1]]) }),
      AutoAffectationMember.from({ session, id: 'member-2', excludedJurisdictions: new Set(), affectationCountPerGrade: new Map([[Magistrat.Grade.G3, 1]]) }),
      AutoAffectationMember.from({ session, id: 'member-3', excludedJurisdictions: new Set(), affectationCountPerGrade: new Map() }),
    ];

    const sortedMemberIds = members
      .toSorted(AutoAffectationMember.fromLeastToMostWorkload)
      .map(({ id }) => id);

    expect(sortedMemberIds).toEqual(['member-3', 'member-1', 'member-2']);
  });

  it('should prepare an affectable member', () => {
    const member = AutoAffectationMember.from({
      session,
      id: 'member-1',
      excludedJurisdictions: new Set(),
      affectationCountPerGrade: new Map([[Magistrat.Grade.G1, 1]]),
    });

    const affectableMemberBuilder = member.prepare(4);
    affectableMemberBuilder.increaseTake();

    const affectableMember = affectableMemberBuilder.build();
    expect(affectableMember).toBeInstanceOf(AffectableMember);
    expect(affectableMember.take).toBe(5);
  });

  describe('affectable member', () => {
    it('should not allow an affectation from an excluded jurisdiction', () => {
      const member = new AffectableMember(3, 'member-1', 'SIEGE', new Set(['CA  NANTES']));

      expect(
        member.canReportOn(
          AutoAffectationNominationFile.from({
            session,
            number: 1,
            id: 'file-1',
            targetedGrade: Magistrat.Grade.G2,
            targetedJurisdiction: 'CA  NANTES',
            currentJurisdiction: 'CA  LYON',
          }),
        ),
      ).toBe(false);
    });

    it('should check affectation on a list of files', () => {
      const member = new AffectableMember(3, 'member-1', 'SIEGE', new Set(['CA  NANTES']));

      const files = ['CA  STRASBOURG', 'CA  NANTES'].map(
        // oxfmt-ignore
        (targetedJurisdiction, i) => AutoAffectationNominationFile.from({ number: i + 1, id: `file-${i + 1}`, targetedGrade: Magistrat.Grade.G2, currentJurisdiction: 'CA  LYON', targetedJurisdiction, session }),
      );

      expect(member.canReportOn(files)).toBe(false);
    });

    it('should not allow an affectation from another formation', () => {
      const member = new AffectableMember(3, 'member-1', 'SIEGE', new Set(['CA  NANTES']));

      expect(
        member.canReportOn(
          AutoAffectationNominationFile.from({
            number: 1,
            id: 'file-1',
            targetedGrade: Magistrat.Grade.G2,
            targetedJurisdiction: 'CA  STRASBOURG',
            currentJurisdiction: 'CA  LYON',
            session: {
              formation: 'PARQUET',
              date: session.date,
            },
          }),
        ),
      ).toBe(false);
    });

    it('should allow an affectation', () => {
      const member = new AffectableMember(3, 'member-1', 'SIEGE', new Set(['CA  NANTES']));

      expect(
        member.canReportOn(
          AutoAffectationNominationFile.from({
            session,
            number: 1,
            id: 'file-1',
            targetedGrade: Magistrat.Grade.G2,
            targetedJurisdiction: 'CA  STRASBOURG',
            currentJurisdiction: 'CA  LYON',
          }),
        ),
      ).toBe(true);
    });

    it('should exchange files with another member', () => {
      const member1 = new AffectableMember(3, 'member-1', 'SIEGE', new Set(['CA  NANTES']));

      const member2 = new AffectableMember(3, 'member-2', 'SIEGE', new Set());

      member2.affect([
        AutoAffectationNominationFile.from({
          number: 1,
          id: 'file-1',
          targetedGrade: Magistrat.Grade.G2,
          targetedJurisdiction: 'CA  STRASBOURG',
          currentJurisdiction: 'CA  LYON',
          session: {
            formation: 'SIEGE',
            date: session.date,
          },
        }),
        AutoAffectationNominationFile.from({
          number: 2,
          id: 'file-2',
          targetedGrade: Magistrat.Grade.G2,
          targetedJurisdiction: 'CA  STRASBOURG',
          currentJurisdiction: 'CA  LYON',
          session: {
            formation: 'SIEGE',
            date: session.date,
          },
        }),
      ]);

      const exchanged = member2.exchangeLastAffectationWith(member1, [
        AutoAffectationNominationFile.from({
          number: 3,
          id: 'file-3',
          targetedGrade: Magistrat.Grade.G2,
          targetedJurisdiction: 'CA  STRASBOURG',
          currentJurisdiction: 'CA  NANTES',
          session: {
            formation: 'SIEGE',
            date: session.date,
          },
        }),
      ]);

      expect(exchanged).toBe(true);
      expect(member1.affectations).toEqual([
        expect.objectContaining({ nominationFileId: 'file-1' }),
        expect.objectContaining({ nominationFileId: 'file-2' }),
      ]);
      expect(member2.affectations).toEqual([expect.objectContaining({ nominationFileId: 'file-3' })]);
    });

    it('should NOT exchange files with another not compatible member', () => {
      const member1 = new AffectableMember(3, 'member-1', 'SIEGE', new Set(['CA  NANTES']));

      const member2 = new AffectableMember(3, 'member-2', 'SIEGE', new Set(['CA  STRASBOURG']));

      member2.affect([
        AutoAffectationNominationFile.from({
          number: 1,
          id: 'file-1',
          targetedGrade: Magistrat.Grade.G2,
          targetedJurisdiction: 'CA  RENNES',
          currentJurisdiction: 'CA  LYON',
          session: {
            formation: 'SIEGE',
            date: session.date,
          },
        }),
        AutoAffectationNominationFile.from({
          number: 2,
          id: 'file-2',
          targetedGrade: Magistrat.Grade.G2,
          targetedJurisdiction: 'CA  RENNES',
          currentJurisdiction: 'CA  LYON',
          session: {
            formation: 'SIEGE',
            date: session.date,
          },
        }),
      ]);

      const exchanged = member2.exchangeLastAffectationWith(member1, [
        AutoAffectationNominationFile.from({
          number: 3,
          id: 'file-3',
          targetedGrade: Magistrat.Grade.G2,
          targetedJurisdiction: 'CA  STRASBOURG',
          currentJurisdiction: 'CA  NANTES',
          session: {
            formation: 'SIEGE',
            date: session.date,
          },
        }),
      ]);

      expect(exchanged).toBe(false);
    });

    it('should NOT exchange files with a member without affectations', () => {
      const member1 = new AffectableMember(3, 'member-1', 'SIEGE', new Set(['CA  NANTES']));

      const member2 = new AffectableMember(3, 'member-2', 'SIEGE', new Set(['CA  STRASBOURG']));

      const exchanged = member2.exchangeLastAffectationWith(member1, [
        AutoAffectationNominationFile.from({
          number: 3,
          id: 'file-3',
          targetedGrade: Magistrat.Grade.G2,
          targetedJurisdiction: 'CA  STRASBOURG',
          currentJurisdiction: 'CA  NANTES',
          session: {
            formation: 'SIEGE',
            date: session.date,
          },
        }),
      ]);

      expect(exchanged).toBe(false);
    });

    it('should NOT exchange files with a member without affectations when files are not compatible', () => {
      const member1 = new AffectableMember(3, 'member-1', 'SIEGE', new Set(['CA  NANTES', 'CA  LYON']));

      const member2 = new AffectableMember(3, 'member-2', 'SIEGE', new Set());

      member2.affect([
        AutoAffectationNominationFile.from({
          number: 1,
          id: 'file-1',
          targetedGrade: Magistrat.Grade.G2,
          targetedJurisdiction: 'CA  RENNES',
          currentJurisdiction: 'CA  LYON',
          session: {
            formation: 'SIEGE',
            date: session.date,
          },
        }),
      ]);

      const exchanged = member2.exchangeLastAffectationWith(member1, [
        AutoAffectationNominationFile.from({
          number: 3,
          id: 'file-3',
          targetedGrade: Magistrat.Grade.G2,
          targetedJurisdiction: 'CA  STRASBOURG',
          currentJurisdiction: 'CA  NANTES',
          session: {
            formation: 'SIEGE',
            date: session.date,
          },
        }),
      ]);

      expect(exchanged).toBe(false);
    });
  });
});
