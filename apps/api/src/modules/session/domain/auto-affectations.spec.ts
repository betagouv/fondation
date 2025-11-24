import { Magistrat } from 'shared-models';
import {
  AutoAffectations,
  AutoAffectationNominationFile,
  AutoAffectationMember,
} from './auto-affectations';

describe('automated affectation', () => {
  it('should exclude a nomination file, when targeting the same jurisdiction as the member', () => {
    const member = AutoAffectationMember.from({
      formation: Magistrat.Formation.PARQUET,
      excludedJurisdictions: new Set(['CA  RENNES']),
      pastReportContributionsCount: 0,
      id: 'memberId',
    });
    const file: AutoAffectationNominationFile = {
      id: 'nominationSessionFileId',
      formation: Magistrat.Formation.PARQUET,
      targetJurisdiction: 'CA  RENNES',
    };

    expect(member.canReportOn(file)).toBe(false);
  });

  it('should allow a nomination file, when the jurisdiction is not defined', () => {
    const member = AutoAffectationMember.from({
      formation: Magistrat.Formation.PARQUET,
      excludedJurisdictions: null,
      pastReportContributionsCount: 0,
      id: 'memberId',
    });

    const file: AutoAffectationNominationFile = {
      id: 'nominationSessionFileId',
      formation: Magistrat.Formation.PARQUET,
      targetJurisdiction: 'CA RENNES',
    };

    expect(member.canReportOn(file)).toBe(true);
  });

  it('should allow a nomination file, when targeting a different jurisdiction than the member', () => {
    const member = AutoAffectationMember.from({
      formation: Magistrat.Formation.PARQUET,
      excludedJurisdictions: new Set(['CA  RENNES']),
      pastReportContributionsCount: 0,
      id: 'memberId',
    });

    const file: AutoAffectationNominationFile = {
      id: 'nominationSessionFileId',
      formation: Magistrat.Formation.PARQUET,
      targetJurisdiction: 'TGI RENNES',
    };

    expect(member.canReportOn(file)).toBe(true);
  });

  it('should exclude a nomination file from a different formation than the member', () => {
    const member = AutoAffectationMember.from({
      formation: Magistrat.Formation.SIEGE,
      excludedJurisdictions: new Set(['CA  RENNES']),
      pastReportContributionsCount: 0,
      id: 'memberId',
    });
    const file: AutoAffectationNominationFile = {
      id: 'nominationSessionFileId',
      formation: Magistrat.Formation.PARQUET,
      targetJurisdiction: 'TGI RENNES',
    };
    expect(member.canReportOn(file)).toBe(false);
  });

  it('should use the report contributions count to auto affect members to nomination files', () => {
    const members = [
      AutoAffectationMember.from({
        formation: Magistrat.Formation.PARQUET,
        excludedJurisdictions: new Set(['CA  RENNES']),
        pastReportContributionsCount: 10,
        id: 'memberId',
      }),
      AutoAffectationMember.from({
        formation: Magistrat.Formation.PARQUET,
        excludedJurisdictions: new Set(['CA  STRASBOURG']),
        pastReportContributionsCount: 5,
        id: 'memberId2',
      }),
      AutoAffectationMember.from({
        formation: Magistrat.Formation.PARQUET,
        excludedJurisdictions: new Set(['CA  LYON']),
        pastReportContributionsCount: 0,
        id: 'memberId3',
      }),
    ];

    const file: AutoAffectationNominationFile = {
      id: 'nominationSessionFileId',
      formation: Magistrat.Formation.PARQUET,
      targetJurisdiction: 'TGI  NANTES',
    };

    const result = AutoAffectations.from({
      files: [file],
      members: [...members],
    }).distribute();

    const affectation = result.find(
      ({ nominationFileId }) => nominationFileId === file.id,
    );

    expect(affectation).toEqual({
      nominationFileId: 'nominationSessionFileId',
      reporterIds: ['memberId3'],
    });
  });
});
