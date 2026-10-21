import type { LolfiArchiveContent } from 'lolfi';

import type {
  CreateOfficialReportDto,
  CreateOrUpdateAgendaDto,
  CreateOrUpdateJusticePresentationPlanDto,
} from '../generated/api/types.ts';
import type { TestStepsAdmin, TestStepsAgent } from '../steps.ts';
import * as seed from '../utils/seed.ts';
import type { CreatedSession, SessionStage } from './session.fixture.ts';

export const MEETING_DATE = { day: 10, month: 2, year: 2026 } as const;

const SESSION: LolfiArchiveContent['sessions'][number] = {
  candidates: [
    {
      civilite: 'M.',
      firstName: 'ANTONIO',
      lastName: 'GRAMSCI',
      position: { function: seed.functions.PR, grade: 'G3', jurisdiction: seed.jurisdictions['CA  AMIENS'] },
      targetPosition: { function: seed.functions.PR, grade: 'G3', jurisdiction: seed.jurisdictions['CA  REIMS'] },
    },
    {
      civilite: 'MME',
      firstName: 'HANNAH',
      lastName: 'ARENDT',
      position: { function: seed.functions.PR, grade: 'G3', jurisdiction: seed.jurisdictions['CA  GRENOBLE'] },
      targetPosition: { function: seed.functions.PR, grade: 'G3', jurisdiction: seed.jurisdictions['CA  LYON'] },
    },
  ],
  createdAt: '23/04/2026',
};

type DocStatus = 'DRAFT' | 'VALIDATED';

export type CreatedAgenda = { id: string; sessionId: string };

/** brings the documents of a session to a status, signed by the same chairman, secretary and justice contact */
export async function makeDocsFixture({
  admin,
  agent,
  registerUser,
  sessions,
}: {
  admin: TestStepsAdmin;
  agent: TestStepsAgent;
  registerUser: (role: 'ADJOINT_SECRETAIRE_GENERAL' | 'MEMBRE_DU_PARQUET') => Promise<{ id: string }>;
  sessions: {
    createOne(session: LolfiArchiveContent['sessions'][number], stage?: SessionStage): Promise<CreatedSession>;
  };
}) {
  const chairman = await registerUser('MEMBRE_DU_PARQUET');
  await admin.administration.updateRole({
    body: { role: 'PRESIDENT_PARQUET' },
    path: { userId: chairman.id },
    throwOnError: true,
  });

  const secretary = await registerUser('ADJOINT_SECRETAIRE_GENERAL');
  await admin.administration.updateRole({
    body: { role: 'FIRST_SECRETARY' },
    path: { userId: secretary.id },
    throwOnError: true,
  });

  const { data: justiceContact } = await agent.docs.createJusticeContact({
    body: { name: `M. Vincent de la Porte, adjoint ${crypto.randomUUID()}` },
    throwOnError: true,
  });

  let presentMember: Promise<unknown> | undefined;

  async function session(stage: SessionStage = {}): Promise<CreatedSession> {
    const created = await sessions.createOne(SESSION, stage);
    await agent.sessions.validateSession({ path: { sessionId: created.id }, throwOnError: true });

    return created;
  }

  async function agenda(
    { files, id: sessionId }: CreatedSession,
    {
      files: listed = files,
      status = 'DRAFT',
      ...body
    }: Partial<Omit<CreateOrUpdateAgendaDto, 'nominationFileIds'>> & {
      files?: readonly { id: string }[];
      status?: DocStatus;
    } = {},
  ): Promise<CreatedAgenda> {
    const { data } = await agent.docs.createAgenda({
      body: {
        chairmanId: chairman.id,
        date: { day: 1, month: 2, year: 2026 },
        nominationFileIds: listed.map(({ id }) => id),
        sessionMeetingDate: MEETING_DATE,
        ...body,
      },
      path: { sessionId },
      throwOnError: true,
    });
    if (status === 'VALIDATED') await agent.docs.validateAgenda({ path: { agendaId: data.id }, throwOnError: true });

    return { id: data.id, sessionId };
  }

  async function officialReport(
    { id: agendaId, sessionId }: CreatedAgenda,
    { status = 'DRAFT', ...body }: Partial<Omit<CreateOfficialReportDto, 'agendaId'>> & { status?: DocStatus } = {},
  ): Promise<{ id: string }> {
    const { data } = await agent.docs.createOfficialReport({
      body: {
        absentMemberIds: [],
        agendaId,
        chairmanId: chairman.id,
        hasRenunciation: true,
        justiceDepartmentContactId: justiceContact.id,
        secretaryId: secretary.id,
        sessionMeetingDate: MEETING_DATE,
        sessionMeetingEndingTime: { hours: 18, minutes: 10, seconds: 0 },
        sessionMeetingTime: { hours: 18, minutes: 0, seconds: 0 },
        ...body,
      },
      path: { sessionId },
      throwOnError: true,
    });
    if (status === 'VALIDATED') {
      await agent.docs.validateOfficialReport({ path: { officialReportId: data.id }, throwOnError: true });
    }

    return { id: data.id };
  }

  async function notice(
    agendas: readonly [{ id: string }, ...{ id: string }[]],
    {
      status = 'DRAFT',
      ...body
    }: Partial<Omit<CreateOrUpdateJusticePresentationPlanDto, 'agendas'>> & { status?: DocStatus | 'PRESENTED' } = {},
  ): Promise<{ id: string }> {
    // the notice refuses a formation whose only present member presides it
    presentMember ??= registerUser('MEMBRE_DU_PARQUET');
    await presentMember;

    const { data } = await agent.docs.createJusticePresentationPlan({
      body: {
        absentMembers: [],
        agendas: agendas.map(({ id }) => ({ comment: null, id })),
        chairmanId: chairman.id,
        date: MEETING_DATE,
        hasRenunciation: true,
        justiceContactId: justiceContact.id,
        secretaryId: secretary.id,
        time: { hours: 9, minutes: 30, seconds: 0 },
        ...body,
      },
      throwOnError: true,
    });
    const path = { planId: data.id };

    if (status !== 'DRAFT') {
      // the notice holds no text until it is read, and the pdf has none without it
      await agent.docs.generatePresentationPlanHtml({ path, throwOnError: true });
      await agent.docs.validatePresentationPlan({ path, throwOnError: true });
    }
    if (status === 'PRESENTED') {
      await agent.docs.presentPlan({
        body: { endTime: { hours: 11, minutes: 0, seconds: 0 } },
        path,
        throwOnError: true,
      });
    }

    return { id: data.id };
  }

  return {
    agenda,
    chairman: { id: chairman.id },
    justiceContact,
    notice,
    officialReport,
    secretary: { id: secretary.id },
    session,
  };
}
