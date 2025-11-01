import { Injectable } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';
import { Db } from 'src/modules/framework/drizzle';
import { drizzleJurisdiction } from 'src/modules/framework/drizzle/schemas';
import { buildConflictUpdateColumns } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-sql-preparation';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { z } from 'zod';
import { chunk } from 'lodash';

@Injectable()
export class IngestXmlJurisdiction {
  constructor(private readonly db: Db) {}

  async execute(document: Buffer): Promise<{ updated: number }> {
    const parser = new XMLParser({
      numberParseOptions: { skipLike: /.+/, hex: false, leadingZeros: false },
    });
    const xmlAsJson = parser.parse(document.toString('latin1'));
    const {
      lolfi: { juridictions },
    } = await LolfiJuridictionListSchema.parseAsync(xmlAsJson);

    let updated = 0;
    await this.db.transaction(async (tx) => {
      // By default Pg only allows 32,768 parameters and we have 11 fields
      for (const page of chunk(juridictions, 32_768 / 11)) {
        const result = await tx
          .insert(drizzleJurisdiction)
          .values(
            page.map((j) => ({
              adr1: j.adr1,
              adr2: j.adr2,
              arrondissement: j.arrondissement,
              codejur: j.codejur,
              codepos: j.codepos,
              date_suppression: DateOnly.fromString(
                j.date_suppression,
              ).toDate(),
              libelle: j.libelle,
              ressort: j.ressort,
              type_jur: j.type_jur,
              ville_jur: j.ville_jur,
              ville: j.ville,
            })),
          )
          .onConflictDoUpdate({
            target: drizzleJurisdiction.codejur,
            set: buildConflictUpdateColumns(drizzleJurisdiction, [
              'adr1',
              'adr2',
              'arrondissement',
              'codepos',
              'date_suppression',
              'libelle',
              'ressort',
              'type_jur',
              'ville_jur',
              'ville',
            ]),
          });

        updated += result.rowCount ?? 0;
      }
    });

    return { updated };
  }
}

const LolfiJurisdictionSchema = z.object({
  adr1: z.string().nullable(),
  adr2: z.string().nullable(),
  arrondissement: z.string().nullable(),
  codejur: z.string().nonempty(),
  codepos: z.string().nullable(),
  date_suppression: z.string().regex(/\d\d\/\d\d\/\d{4}/),
  libelle: z.string(),
  ressort: z.string().nullable(),
  srj: z.string().nullable(),
  teleph: z.string().nullable(),
  type_jur: z.string().nonempty(),
  ville_jur: z.string().nullable(),
  ville: z.string().nullable(),
});

const LolfiJuridictionListSchema = z.object({
  lolfi: z.object({ juridictions: z.array(LolfiJurisdictionSchema) }),
});
