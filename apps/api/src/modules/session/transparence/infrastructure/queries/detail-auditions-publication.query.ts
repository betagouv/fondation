import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { AuditionPublicationFinder } from '../finders/audition-publication.finder';
import { fullname } from 'src/utils/user.util';

const PUBLICATION_STATUSES = ['NEVER_PUBLISHED', 'PUBLISHED', 'UNPUBLISHED_CHANGES'] as const;

@Injectable()
export class DetailAuditionsPublicationQuery {
  constructor(private readonly auditionPublications: AuditionPublicationFinder) {}

  @Transactional()
  async handle(query: { sessionId: string }): Promise<DetailedAuditionsPublicationDto> {
    const last = await this.auditionPublications.last(query);
    if (!last) return { lastPublished: null, status: 'NEVER_PUBLISHED' };

    const current = await this.auditionPublications.current(query);
    return {
      lastPublished: {
        at: last.publishedAt.toISOString(),
        by: last.publisher ? { id: last.publisher.id, name: fullname(last.publisher) } : null,
      },
      status: last.auditions.equals(current) ? 'PUBLISHED' : 'UNPUBLISHED_CHANGES',
    };
  }
}

export class DetailedAuditionsPublicationDto extends createZodDto(
  z.object({
    lastPublished: z
      .object({ at: z.iso.datetime(), by: z.object({ id: z.string(), name: z.string() }).nullable() })
      .nullable(),
    status: z.enum(PUBLICATION_STATUSES),
  }),
) {}
