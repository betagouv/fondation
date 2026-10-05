import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { listMagistratPhoneNumbersRawQuery } from 'src/generated/prisma/sql';
import { Db } from 'src/modules/framework/database';
import { DateOnly, dateOnlyJsonSchema } from 'src/utils/date-only';

@Injectable()
export class ListMagistratPhoneNumbersQuery {
  constructor(private readonly db: Db) {}

  async handle(query: { magistratId: string }): Promise<ListedMagistratPhoneNumbersDto> {
    const phoneNumbers = await this.db.tx.$queryRawTyped(
      listMagistratPhoneNumbersRawQuery(query.magistratId),
    );

    return {
      items: phoneNumbers.flatMap(({ candidacyDate, id, label, number, updatedAt }): PhoneNumber[] => {
        if (!number) return [];
        if (id && updatedAt)
          return [
            { date: DateOnly.fromInstantInParis(updatedAt).toJson(), id, label, number, source: 'FONDATION' },
          ];

        return [
          {
            date: candidacyDate ? DateOnly.fromUtcDate(candidacyDate).toJson() : null,
            number,
            source: 'LOLFI',
          },
        ];
      }),
    };
  }
}

const phoneNumberSchema = z.discriminatedUnion('source', [
  z.object({
    date: dateOnlyJsonSchema,
    id: z.string(),
    label: z.string().nullable(),
    number: z.string(),
    source: z.literal('FONDATION'),
  }),
  z.object({
    date: dateOnlyJsonSchema.nullable(),
    number: z.string(),
    source: z.literal('LOLFI'),
  }),
]);

type PhoneNumber = z.infer<typeof phoneNumberSchema>;

export class ListedMagistratPhoneNumbersDto extends createZodDto(
  z.object({ items: z.array(phoneNumberSchema) }),
) {}
