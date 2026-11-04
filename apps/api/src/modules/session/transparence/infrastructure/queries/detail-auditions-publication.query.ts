import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { writerOf, writerSchema } from '../../../../../utils/user.util';
import { PUBLICATION_STATUSES } from '../../../../shared/publication-status.enum';
import { publicationStatusOf } from '../../domain/publication';
import { AuditionPublicationFinder } from '../finders/audition-publication.finder';

@Injectable()
export class DetailAuditionsPublicationQuery {
  constructor(private readonly auditionPublications: AuditionPublicationFinder) {}

  @Transactional()
  async handle(query: { sessionId: string }): Promise<DetailedAuditionsPublicationDto> {
    const last = await this.auditionPublications.last(query);
    const current = await this.auditionPublications.current(query);

    return {
      lastPublished: last ? { at: last.publishedAt.toISOString(), by: writerOf(last.publisher) } : null,
      status: publicationStatusOf({ current, published: last?.auditions ?? null }),
    };
  }
}

export class DetailedAuditionsPublicationDto extends createZodDto(
  z.object({
    lastPublished: z.object({ at: z.iso.datetime(), by: writerSchema }).nullable(),
    status: z.enum(PUBLICATION_STATUSES),
  }),
) {}
