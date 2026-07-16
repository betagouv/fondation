import { Role } from 'shared-models';

import { GenderEnum } from 'src/modules/shared/gender.enum';
import { DateOnly } from 'src/utils/date-only';

import { EmptyMembersList, OfficialReport } from './official-report';

describe('OfficialReport', () => {
  it('should prevent creating an official report without members', () => {
    expect(() =>
      OfficialReport.create({
        members: [],

        absentMembers: new Set(),
        authorId: 'author-1',
        chairman: {
          displayTitle: null,
          duty: 'PRESIDENT',
          firstName: 'victor',
          lastName: 'hugo',
          gender: GenderEnum.MALE,
          id: 'chairman-1',
          role: Role.MEMBRE_DU_SIEGE,
          title: 'PRESIDENT_SIEGE',
          sort: 1,
        },
        formation: 'SIEGE',
        hasRenunciation: true,
        justiceDepartmentContactId: 'contact-1',
        secretary: {
          displayTitle: null,
          duty: 'SECRETARY',
          title: 'FIRST_SECRETARY',
          firstName: 'jean-jacques',
          lastName: 'rousseau',
          id: 'secretary-1',
          gender: GenderEnum.MALE,
          role: Role.ADJOINT_SECRETAIRE_GENERAL,
        },
        sessionMeetingDate: DateOnly.fromJson({ year: 2026, month: 2, day: 1 }),
        sessionMeetingStartingTime: { hours: 10, minutes: 0, seconds: 0 },
        sessionMeetingEndingTime: { hours: 10, minutes: 10, seconds: 0 },
        agendas: [
          {
            formation: 'SIEGE',
            id: 'agenda-1',
            officialReportId: null,
            session: { id: 'session-1' },
          },
        ],
      }),
    ).toThrow(EmptyMembersList);
  });

  it('should prevent creating an official report without present members', () => {
    expect(() =>
      OfficialReport.create({
        members: [
          {
            id: 'member-1',
            duty: null,
            displayTitle: null,
            role: Role.MEMBRE_DU_SIEGE,
            firstName: 'rené',
            lastName: 'descartes',
            gender: GenderEnum.MALE,
            title: null,
            sort: 2,
          },
        ],
        absentMembers: new Set(['member-1']),

        authorId: 'author-1',
        chairman: {
          displayTitle: null,
          duty: 'PRESIDENT',
          firstName: 'victor',
          lastName: 'hugo',
          gender: GenderEnum.MALE,
          id: 'chairman-1',
          role: Role.MEMBRE_DU_SIEGE,
          title: 'PRESIDENT_SIEGE',
          sort: 1,
        },
        formation: 'SIEGE',
        hasRenunciation: true,
        justiceDepartmentContactId: 'contact-1',
        secretary: {
          displayTitle: null,
          duty: 'SECRETARY',
          title: 'FIRST_SECRETARY',
          firstName: 'jean-jacques',
          lastName: 'rousseau',
          id: 'secretary-1',
          gender: GenderEnum.MALE,
          role: Role.ADJOINT_SECRETAIRE_GENERAL,
        },
        sessionMeetingDate: DateOnly.fromJson({ year: 2026, month: 2, day: 1 }),
        sessionMeetingStartingTime: { hours: 10, minutes: 0, seconds: 0 },
        sessionMeetingEndingTime: { hours: 10, minutes: 10, seconds: 0 },
        agendas: [
          {
            formation: 'SIEGE',
            id: 'agenda-1',
            officialReportId: null,
            session: { id: 'session-1' },
          },
        ],
      }),
    ).toThrow(EmptyMembersList);
  });

  it('should prevent updating an official report without members', () => {
    const report = OfficialReport.from({ formation: 'SIEGE', id: 'official-report-1' });
    expect(() =>
      report.update({
        members: [],
        absentMembers: new Set(),

        authorId: 'author-1',
        chairman: {
          sort: 1,
          displayTitle: null,
          duty: 'PRESIDENT',
          firstName: 'victor',
          lastName: 'hugo',
          gender: GenderEnum.MALE,
          id: 'chairman-1',
          role: Role.MEMBRE_DU_SIEGE,
          title: 'PRESIDENT_SIEGE',
        },
        hasRenunciation: true,
        justiceDepartmentContactId: 'contact-1',
        secretary: {
          displayTitle: null,
          duty: 'SECRETARY',
          title: 'FIRST_SECRETARY',
          firstName: 'jean-jacques',
          lastName: 'rousseau',
          id: 'secretary-1',
          gender: GenderEnum.MALE,
          role: Role.ADJOINT_SECRETAIRE_GENERAL,
        },
        sessionMeetingDate: DateOnly.fromJson({ year: 2026, month: 2, day: 1 }),
        sessionMeetingStartingTime: { hours: 10, minutes: 0, seconds: 0 },
        sessionMeetingEndingTime: { hours: 10, minutes: 10, seconds: 0 },
        agendas: [
          {
            formation: 'SIEGE',
            id: 'agenda-1',
            officialReportId: null,
            session: { id: 'session-1' },
          },
        ],
      }),
    ).toThrow(EmptyMembersList);
  });

  it('should prevent updating an official report without present members', () => {
    const report = OfficialReport.from({ formation: 'SIEGE', id: 'official-report-1' });
    expect(() =>
      report.update({
        members: [
          {
            id: 'member-1',
            duty: null,
            displayTitle: null,
            role: Role.MEMBRE_DU_SIEGE,
            firstName: 'rené',
            lastName: 'descartes',
            gender: GenderEnum.MALE,
            title: null,
            sort: 2,
          },
        ],
        absentMembers: new Set(['member-1']),

        authorId: 'author-1',
        chairman: {
          displayTitle: null,
          duty: 'PRESIDENT',
          firstName: 'victor',
          lastName: 'hugo',
          gender: GenderEnum.MALE,
          id: 'chairman-1',
          role: Role.MEMBRE_DU_SIEGE,
          title: 'PRESIDENT_SIEGE',
          sort: 1,
        },
        hasRenunciation: true,
        justiceDepartmentContactId: 'contact-1',
        secretary: {
          displayTitle: null,
          duty: 'SECRETARY',
          title: 'FIRST_SECRETARY',
          firstName: 'jean-jacques',
          lastName: 'rousseau',
          id: 'secretary-1',
          gender: GenderEnum.MALE,
          role: Role.ADJOINT_SECRETAIRE_GENERAL,
        },
        sessionMeetingDate: DateOnly.fromJson({ year: 2026, month: 2, day: 1 }),
        sessionMeetingStartingTime: { hours: 10, minutes: 0, seconds: 0 },
        sessionMeetingEndingTime: { hours: 10, minutes: 10, seconds: 0 },
        agendas: [
          {
            formation: 'SIEGE',
            id: 'agenda-1',
            officialReportId: null,
            session: { id: 'session-1' },
          },
        ],
      }),
    ).toThrow(EmptyMembersList);
  });
});
