import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from '../../../../../generated/prisma/client';
import { dateOnlyJsonSchema } from '../../../../../utils/date-only';
import { DateOnly } from '../../../../../utils/date-only';
import { assertIsDefined } from '../../../../../utils/is-defined';
import { dateToTimeOnly, timeOnlySchema } from '../../../../../utils/time-only';
import { writerOf, writerSchema } from '../../../../../utils/user.util';
import { Db } from '../../../../framework/database';
import { FormationEnum } from '../../../../shared/formation.enum';
import { prismaFormationEnumToFormationEnum } from '../../../../shared/mappers/formation.mapper';
import { canValidateDocument } from '../../../shared/domain/document.policies';
import { AGENDA_CONTENT_VERSIONS, agendaContentOf } from '../../../shared/infrastructure/agenda-content';
import {
  draftTrace,
  draftTraceSchema,
  presentationTraceOf,
  presentationTraceSchema,
  traceOf,
  traceSchema,
} from '../../../shared/infrastructure/document-trace';
import { canEditPresentationPlan } from '../../domain/presentation-plan.policies';
import { presentationPlanStatusOf, presentationPlanStatusSchema } from '../presentation-plan-status';

const chairmanSchema = z.object({ firstName: z.string(), lastName: z.string() });

@Injectable()
export class DetailsPresentationPlanMetadataQuery {
  constructor(private readonly db: Db) {}

  async handle(query: { id: string }): Promise<DetailedPresentationPlanMetadataDto> {
    const plan = await this.db.tx.justicePresentationPlan.findUnique({
      select: {
        agendas: {
          select: {
            agenda: { select: { formation: true } },
            agendaId: true,
            comment: true,
          },
        },
        author: { select: { firstName: true, id: true, lastName: true } },
        chairmanId: true,
        createdAt: true,
        date: true,
        editor: { select: { firstName: true, id: true, lastName: true } },
        endTime: true,
        hasRenunciation: true,
        id: true,
        isManuallyEdited: true,
        isPresented: true,
        justiceDepartmentContactId: true,
        members: { select: { isAbsent: true, memberId: true } },
        outdated: true,
        pdfId: true,
        presenter: { select: { firstName: true, id: true, lastName: true } },
        removedAgendas: {
          orderBy: { removedAt: 'asc' },
          select: {
            agenda: {
              select: {
                versions: {
                  ...AGENDA_CONTENT_VERSIONS,
                  select: {
                    chairmanFirstName: true,
                    chairmanLastName: true,
                    sessionMeetingDate: true,
                    status: true,
                  },
                },
              },
            },
            agendaId: true,
            removedAt: true,
            remover: { select: { firstName: true, id: true, lastName: true } },
            takenBy: {
              select: { chairmanFirstName: true, chairmanLastName: true, date: true, id: true, time: true },
            },
          },
        },
        secretaryId: true,
        time: true,
        updatedAt: true,
        validatedAt: true,
        validator: { select: { firstName: true, id: true, lastName: true } },
      } satisfies Prisma.JusticePresentationPlanSelect,
      where: { id: query.id },
    });

    if (!plan) throw new NotFoundException();
    const status = presentationPlanStatusOf(plan);

    return {
      id: plan.id,
      chairmanId: plan.chairmanId,
      secretaryId: plan.secretaryId,
      outdated: plan.outdated,
      status,
      isPresented: plan.isPresented,
      canEdit: canEditPresentationPlan(plan),
      canValidate: canValidateDocument({ isValidated: status === 'VALIDATED' }),
      // a notice has no version underneath: its draft is the notice itself, never opened by the application
      draft: draftTrace({ ...plan, status, systemUpdatedAt: null, systemUpdates: [] }),
      validation: status === 'VALIDATED' ? traceOf(plan.validatedAt, plan.validator) : null,
      presentation: plan.isPresented ? presentationTraceOf(plan) : null,
      isManuallyEdited: plan.isManuallyEdited,
      hasRenunciation: plan.hasRenunciation,
      date: DateOnly.fromUtcDate(plan.date).toJson(),
      time: dateToTimeOnly(plan.time),
      formation: prismaFormationEnumToFormationEnum(assertIsDefined(plan.agendas[0]).agenda.formation),
      agendas: plan.agendas.map(({ agendaId, comment }) => ({
        comment,
        id: agendaId,
      })),
      justiceDepartmentContactId: plan.justiceDepartmentContactId?.toString() ?? null,
      absentMemberIds: plan.members.filter((m) => m.isAbsent).map((m) => m.memberId),
      recordedMemberIds: plan.members.map(({ memberId }) => memberId),
      removedAgendas: plan.removedAgendas.flatMap(({ agenda, agendaId, remover, removedAt, takenBy }) => {
        const content = agendaContentOf(agenda.versions);
        if (!content) return [];

        return [
          {
            agenda: {
              id: agendaId,
              sessionMeetingDate: DateOnly.fromUtcDate(content.sessionMeetingDate).toJson(),
              chairman: { firstName: content.chairmanFirstName, lastName: content.chairmanLastName },
            },
            takenBy: {
              id: takenBy.id,
              date: DateOnly.fromUtcDate(takenBy.date).toJson(),
              time: dateToTimeOnly(takenBy.time),
              chairman: { firstName: takenBy.chairmanFirstName, lastName: takenBy.chairmanLastName },
            },
            removedAt: removedAt.toISOString(),
            removedBy: writerOf(remover),
          },
        ];
      }),
    };
  }
}

export class DetailedPresentationPlanMetadataDto extends createZodDto(
  z.object({
    id: z.string(),
    time: timeOnlySchema,
    date: dateOnlyJsonSchema,
    outdated: z.boolean(),
    status: presentationPlanStatusSchema,
    isPresented: z.boolean(),
    canEdit: z.boolean(),
    canValidate: z.boolean(),
    draft: draftTraceSchema,
    validation: traceSchema,
    /** null while the notice is not presented */
    presentation: presentationTraceSchema.nullable(),
    isManuallyEdited: z.boolean(),
    formation: z.enum(FormationEnum),
    agendas: z.array(z.object({ id: z.string(), comment: z.string() })),
    chairmanId: z.string().nullable(),
    secretaryId: z.string().nullable(),
    justiceDepartmentContactId: z.string().nullable(),
    hasRenunciation: z.boolean(),
    absentMemberIds: z.array(z.string()),
    recordedMemberIds: z.array(z.string()),
    removedAgendas: z.array(
      z.object({
        agenda: z.object({
          id: z.string(),
          sessionMeetingDate: dateOnlyJsonSchema,
          chairman: chairmanSchema,
        }),
        takenBy: z.object({
          id: z.string(),
          date: dateOnlyJsonSchema,
          time: timeOnlySchema,
          chairman: chairmanSchema,
        }),
        removedAt: z.iso.datetime(),
        removedBy: writerSchema,
      }),
    ),
  }),
) {}
