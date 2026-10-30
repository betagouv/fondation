import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { listMagistratPhoneNumbersRawQuery } from '../../../../generated/prisma/sql';
import { DateOnly, dateOnlyJsonSchema } from '../../../../utils/date-only';
import { writerOf, writerSchema } from '../../../../utils/user.util';
import { Db } from '../../../framework/database';

@Injectable()
export class ListMagistratPhoneNumbersQuery {
  constructor(private readonly db: Db) {}

  async handle(query: { magistratId: string }): Promise<ListedMagistratPhoneNumbersDto> {
    const phoneNumbers = await this.db.tx.$queryRawTyped(
      listMagistratPhoneNumbersRawQuery(query.magistratId),
    );

    return {
      items: phoneNumbers.flatMap((phoneNumber): PhoneNumber[] => {
        const { authorFirstName, authorId, authorLastName, candidacyDate, id, label, number, updatedAt } =
          phoneNumber;
        if (!number) return [];
        if (id && updatedAt)
          return [
            {
              date: DateOnly.fromInstantInParis(updatedAt).toJson(),
              id,
              label,
              number,
              savedBy: writerOf(
                authorId && authorFirstName && authorLastName
                  ? { firstName: authorFirstName, id: authorId, lastName: authorLastName }
                  : null,
              ),
              source: 'FONDATION',
            },
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
    savedBy: writerSchema,
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
