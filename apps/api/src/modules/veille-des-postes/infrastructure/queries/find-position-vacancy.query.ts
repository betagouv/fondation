import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from '../../../../generated/prisma/client';
import { DateOnly, dateOnlyJsonSchema } from '../../../../utils/date-only';
import { writerOf, writerSchema } from '../../../../utils/user.util';
import { Db } from '../../../framework/database';
import { alertRulesOf, alertsOf } from '../../domain/position-alert';
import { positionStatusOf } from '../../domain/position-status';
import { VACANCY_REASONS, vacancyReasonOf, vacancyReasons } from '../../domain/position-vacancy';
import { HeldPositionFinder } from '../finders/held-position.finder';
import { HolderProposalsFinder } from '../finders/holder-proposals.finder';
import { alertJson, holderAlertSchema, positionStatusSchema } from '../holder-alerts';

@Injectable()
export class FindPositionVacancyQuery {
  constructor(
    private readonly db: Db,
    private readonly heldPositions: HeldPositionFinder,
    private readonly proposals: HolderProposalsFinder,
  ) {}

  @Transactional()
  async handle({ magistratId }: { magistratId: string }): Promise<FoundPositionVacancyDto> {
    const held = await this.heldPositions.byHolder({ magistratId });
    const vacancy = await this.db.tx.positionVacancy.findUnique({
      select: {
        attachments: {
          orderBy: { file: { createdAt: 'desc' } },
          select: {
            file: {
              select: {
                createdAt: true,
                createdBy: { select: { firstName: true, id: true, lastName: true } },
                id: true,
                name: true,
                sizeInBytes: true,
              },
            },
          },
        },
        author: { select: { firstName: true, id: true, lastName: true } },
        reason: true,
        reasonDetail: true,
        startDate: true,
        updatedAt: true,
      } satisfies Prisma.PositionVacancySelect,
      where: { primaryKey: { magistratId, positionId: held.positionId } },
    });
    const proposals = await this.proposals.byHolders({ magistratIds: [magistratId] });
    const today = DateOnly.fromInstantInParis(new Date());
    const alerts = alertsOf(
      {
        birthDate: held.birthDate,
        installationDate: held.installationDate,
        proposal: proposals.get(magistratId) ?? null,
      },
      alertRulesOf(held.watched),
      today,
    );

    return {
      // as the tables give them, which a filter may no longer list once the status changed
      alerts: alerts.map(alertJson),
      reasons: vacancyReasons(),
      status: positionStatusOf(
        {
          alertCount: alerts.length,
          held: true,
          vacancy: vacancy && {
            reason: vacancy.reason,
            reasonDetail: vacancy.reasonDetail,
            startDate: DateOnly.fromUtcDate(vacancy.startDate),
          },
        },
        today,
      ),
      vacancy: vacancy && {
        attachments: vacancy.attachments.map(({ file }) => ({
          addedAt: file.createdAt.toISOString(),
          addedBy: writerOf(file.createdBy),
          id: file.id,
          name: file.name,
          size: file.sizeInBytes,
        })),
        reason: vacancyReasonOf(vacancy.reason),
        reasonDetail: vacancy.reasonDetail,
        startDate: DateOnly.fromUtcDate(vacancy.startDate).toJson(),
        updatedAt: vacancy.updatedAt.toISOString(),
        updatedBy: writerOf(vacancy.author),
      },
    };
  }
}

const vacancyReasonSchema = z.object({ id: z.enum(VACANCY_REASONS), label: z.string() });

export class FoundPositionVacancyDto extends createZodDto(
  z.object({
    alerts: z.array(holderAlertSchema),
    reasons: z.array(vacancyReasonSchema),
    status: positionStatusSchema,
    /** null while the status is the one computed from LOLFI */
    vacancy: z
      .object({
        attachments: z.array(
          z.object({
            addedAt: z.iso.datetime(),
            addedBy: writerSchema,
            id: z.string(),
            name: z.string(),
            size: z.number().int().nullable(),
          }),
        ),
        reason: vacancyReasonSchema,
        reasonDetail: z.string().nullable(),
        startDate: dateOnlyJsonSchema,
        updatedAt: z.iso.datetime(),
        updatedBy: writerSchema,
      })
      .nullable(),
  }),
) {}
