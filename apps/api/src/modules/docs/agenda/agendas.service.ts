import { Transactional } from '@nestjs-cls/transactional';
import { forwardRef, Inject, Injectable, StreamableFile } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Db } from '../../framework/database';
import { MembersService } from '../../members';
import {
  DocInvalidatedIntegrationEvent,
  DocInvalidation,
} from '../shared/domain/invalidation/official-report-invalidated.integration-event';
import { AGENDA_CONTENT_VERSIONS, agendaContentOf } from '../shared/infrastructure/agenda-content';
import { ActedNominationFilesFinder } from '../shared/infrastructure/finders/acted-nomination-files.finder';
import { DocsNominationFilesFinder } from '../shared/infrastructure/finders/docs-nomination-files.finder';
import { Prisma } from 'src/generated/prisma/client';
import { Clock } from 'src/modules/framework/clock';
import { DateOnly, DateOnlyJson } from 'src/utils/date-only';
import { isDefined } from 'src/utils/is-defined';

import { Agenda } from './domain/agenda';
import { CreatedAgendaDto } from './infrastructure/agendas.dto';
import { AgendaVersionFinder } from './infrastructure/finders/agenda-version.finder';
import {
  DetailedAgendaDocumentBlocksDto,
  DetailsAgendaDocumentBlocksQuery,
} from './infrastructure/queries/details-agenda-document-blocks.query';
import {
  DetailedAgendaFilesDto,
  DetailsAgendaFilesQuery,
} from './infrastructure/queries/details-agenda-files.query';
import {
  DetailedAgendaMetadata,
  DetailsAgendaMetadataQuery,
} from './infrastructure/queries/details-agenda-metadata.query';
import {
  DetailedSessionAgenda,
  DetailsSessionAgendaQuery,
} from './infrastructure/queries/details-session-agenda.query';
import { FindAgendaDocumentPdfQuery } from './infrastructure/queries/find-agenda-document-pdf.query';
import { FindAgendaDocumentQuery } from './infrastructure/queries/find-agenda-document.query';
import { AgendaRepository } from './infrastructure/repositories/agenda.repository';
import { InvalidateAgendasUseCase } from './infrastructure/use-cases/invalidate-agenda.use-case';

@Injectable()
export class AgendasService {
  constructor(
    private readonly agendaRepository: AgendaRepository,
    private readonly agendaVersionFinder: AgendaVersionFinder,
    private readonly docsNominationFilesFinder: DocsNominationFilesFinder,
    private readonly actedNominationFilesFinder: ActedNominationFilesFinder,
    private readonly detailsAgendaMetadataQuery: DetailsAgendaMetadataQuery,
    private readonly detailsAgendaFilesQuery: DetailsAgendaFilesQuery,
    private readonly detailsAgendaDocumentBlocksQuery: DetailsAgendaDocumentBlocksQuery,
    private readonly detailsSessionAgendaQuery: DetailsSessionAgendaQuery,
    private readonly findAgendaDocumentPdfQuery: FindAgendaDocumentPdfQuery,
    private readonly findAgendaDocumentQuery: FindAgendaDocumentQuery,
    private readonly invalidateAgendaUseCase: InvalidateAgendasUseCase,
    private readonly clock: Clock,
    private readonly db: Db,

    private readonly events: EventEmitter2,

    @Inject(forwardRef(() => MembersService))
    private readonly members: MembersService,
  ) {}

  @Transactional()
  async createAgenda(command: {
    authorId: string;
    chairmanId: string;
    date: DateOnlyJson;
    nominationFileIds: readonly string[];
    sessionId: string;
    sessionMeetingDate: DateOnlyJson;
  }): Promise<CreatedAgendaDto> {
    const chairman = await this.members.internalGetMember({
      id: command.chairmanId,
    });

    const { items: nominationFiles } = await this.docsNominationFilesFinder.find({
      ids: command.nominationFileIds,
      sessionId: command.sessionId,
    });

    const actedNominationFileIds = await this.actedNominationFilesFinder.find({
      fileIds: new Set(nominationFiles.map(({ id }) => id)),
    });

    const agenda = Agenda.create({
      actedNominationFileIds,
      authorId: command.authorId,
      chairman,
      date: DateOnly.fromJson(command.date),
      nominationFiles: nominationFiles.map((f) => ({
        currentPosition: f.magistrat.position.label,
        grade: f.magistrat.position.grade,
        id: f.id,
        name: f.magistrat.name,
        number: f.number,
        outcome: f.outcome,
        reporters: f.reporters.map((r) => r.fullTitledName),
        targetedGrade: f.targetPosition.grade,
        targetedPosition: f.targetPosition.label,
      })),
      sessionId: command.sessionId,
      sessionMeetingDate: DateOnly.fromJson(command.sessionMeetingDate),
    });

    await this.agendaRepository.persist(agenda);

    return { id: agenda.id };
  }

  async updateAgendaMetadata(command: {
    agendaId: string;
    authorId: string;
    chairmanId: string;
    date: DateOnlyJson;
    sessionMeetingDate: DateOnlyJson;
  }): Promise<void> {
    const invalidations = await this.db.withTransaction(async () => {
      const agenda = await this.agendaRepository.find({
        actorId: command.authorId,
        agendaId: command.agendaId,
      });
      const diff = agenda.updateMetadata({
        authorId: command.authorId,
        chairmanId: command.chairmanId,
        date: DateOnly.fromJson(command.date),
        sessionMeetingDate: DateOnly.fromJson(command.sessionMeetingDate),
      });

      await this.agendaRepository.persist(agenda);

      return diff.hasAny ? diff.officialReportInvalidations : [];
    });

    await this.emitInvalidations(invalidations);
  }

  async updateAgendaFiles(command: {
    agendaId: string;
    authorId: string;
    nominationFileIds: readonly string[];
  }): Promise<void> {
    const invalidations = await this.db.withTransaction(async () => {
      const agenda = await this.agendaRepository.find({
        actorId: command.authorId,
        agendaId: command.agendaId,
      });
      const nominationFileIds = new Set(command.nominationFileIds);
      const actedNominationFileIds = await this.actedNominationFilesFinder.find({
        fileIds: nominationFileIds,
      });

      const diff = agenda.updateFiles({
        actedNominationFileIds,
        authorId: command.authorId,
        nominationFileIds,
      });

      await this.agendaRepository.persist(agenda);

      return diff.hasAny ? diff.officialReportInvalidations : [];
    });

    await this.emitInvalidations(invalidations);
  }

  private async emitInvalidations(invalidations: readonly DocInvalidation[]): Promise<void> {
    for (const invalidation of invalidations) {
      await this.events.emitAsync(
        DocInvalidatedIntegrationEvent.name,
        new DocInvalidatedIntegrationEvent(invalidation),
      );
    }
  }

  @Transactional()
  async deleteAgenda(command: { agendaId: string }): Promise<void> {
    const agenda = await this.agendaRepository.find({ actorId: null, agendaId: command.agendaId });
    agenda.delete();
    await this.agendaRepository.persist(agenda);
  }

  getOrCreateAgendaDocument(query: { forceNew?: boolean; id: string }): Promise<string> {
    return this.findAgendaDocumentQuery.handle(query);
  }

  getOrCreateAgendaDocumentPdf(query: { forceNew?: boolean; id: string }): Promise<StreamableFile> {
    return this.findAgendaDocumentPdfQuery.handle(query);
  }

  detailsSessionAgenda(query: { agendaId: string; sessionId: string }): Promise<DetailedSessionAgenda> {
    return this.detailsSessionAgendaQuery.handle(query);
  }

  detailsAgendaMetadata(query: { agendaId: string }): Promise<DetailedAgendaMetadata> {
    return this.detailsAgendaMetadataQuery.handle(query);
  }

  async validateAgenda(command: { agendaId: string; authorId: string }): Promise<void> {
    // rendering and uploading the PDF stay out of the transaction: they would hold a connection for seconds
    await this.findAgendaDocumentPdfQuery.ensure({ id: command.agendaId });

    await this.announcingSentenceChanges(command.agendaId, () =>
      this.db.withTransaction(async () => {
        const agenda = await this.agendaRepository.find({
          actorId: command.authorId,
          agendaId: command.agendaId,
        });
        agenda.validate({ at: this.clock.now(), authorId: command.authorId });
        await this.agendaRepository.persist(agenda);
      }),
    );

    await this.emitInvalidations([{ payload: { agendaId: command.agendaId }, type: 'AgendaValidated' }]);
  }

  async discardAgendaDraft(command: { agendaId: string }): Promise<void> {
    await this.announcingSentenceChanges(command.agendaId, () =>
      this.db.withTransaction(async () => {
        const hasValidatedVersion = await this.agendaVersionFinder.published({ agendaId: command.agendaId });

        const agenda = await this.agendaRepository.find({ actorId: null, agendaId: command.agendaId });
        agenda.discardDraft({ hasValidatedVersion: isDefined(hasValidatedVersion) });
        await this.agendaRepository.persist(agenda);
      }),
    );
  }

  @Transactional()
  async editAgendaFileBlock(command: {
    agendaId: string;
    authorId: string;
    fileId: bigint;
    html: string;
    outdated: boolean;
  }): Promise<void> {
    await this.announcingSentenceChanges(command.agendaId, () =>
      this.db.withTransaction(async () => {
        const agenda = await this.agendaRepository.find({
          actorId: command.authorId,
          agendaId: command.agendaId,
        });
        agenda.editFileBlock({
          authorId: command.authorId,
          fileId: command.fileId,
          html: command.html,
          outdated: command.outdated,
        });
        await this.agendaRepository.persist(agenda);
      }),
    );
  }

  async resetAgendaFileBlock(command: { agendaId: string; authorId: string; fileId: bigint }): Promise<void> {
    await this.announcingSentenceChanges(command.agendaId, () =>
      this.db.withTransaction(async () => {
        const agenda = await this.agendaRepository.find({
          actorId: command.authorId,
          agendaId: command.agendaId,
        });
        agenda.resetFileBlock({ fileId: command.fileId });
        await this.agendaRepository.persist(agenda);
      }),
    );
  }

  /**
   * the official report answers to the agenda its readers see, which is the validated version
   * whenever there is one: writing in a draft says nothing to the report until it is validated.
   */
  private async announcingSentenceChanges(agendaId: string, operation: () => Promise<void>): Promise<void> {
    const before = await this.readableSentences(agendaId);
    await operation();
    const after = await this.readableSentences(agendaId);

    const changed = new Set([...before.keys(), ...after.keys()]).difference(
      new Set(
        [...after].flatMap(([nominationFileId, sentence]) =>
          before.get(nominationFileId) === sentence ? [nominationFileId] : [],
        ),
      ),
    );

    await this.emitInvalidations(
      [...changed].map((nominationFileId) => ({
        payload: { agendaId, nominationFileId },
        type: 'AgendaFileBlockEdited',
      })),
    );
  }

  /** the sentence each proposition reads today, empty when the agenda leaves it to the template */
  private async readableSentences(agendaId: string): Promise<Map<string, string>> {
    const agenda = await this.db.tx.agenda.findFirst({
      where: { id: agendaId, officialReportId: { not: null } },
      select: {
        versions: {
          ...AGENDA_CONTENT_VERSIONS,
          select: {
            nominationFiles: { select: { htmlEdited: true, nominationFileId: true } },
            status: true,
          },
        },
      } satisfies Prisma.AgendaSelect,
    });

    return new Map(
      (agendaContentOf(agenda?.versions ?? [])?.nominationFiles ?? []).flatMap((file) =>
        file.nominationFileId ? [[file.nominationFileId, file.htmlEdited ?? ''] as const] : [],
      ),
    );
  }

  detailsAgendaFiles(query: { agendaId: string }): Promise<DetailedAgendaFilesDto> {
    return this.detailsAgendaFilesQuery.handle(query);
  }

  detailsAgendaDocumentBlocks(query: { agendaId: string }): Promise<DetailedAgendaDocumentBlocksDto> {
    return this.detailsAgendaDocumentBlocksQuery.handle(query);
  }

  internalInvalidateAgendas(invalidation: DocInvalidation): Promise<void> {
    return this.invalidateAgendaUseCase.handle(invalidation);
  }
}
