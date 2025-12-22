import { Injectable } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';
import { z } from 'zod';
import { PrismaService } from 'src/modules/framework/database';

@Injectable()
export class IngestXmlJurisdiction {
  constructor(private readonly prisma: PrismaService) {}

  async execute(document: Buffer): Promise<{ updated: number }> {
    const parser = new XMLParser({
      numberParseOptions: { skipLike: /.+/, hex: false, leadingZeros: false },
    });
    const xmlAsJson = parser.parse(document.toString('latin1'));
    const {
      lolfi: { juridictions },
    } = await LolfiJuridictionListSchema.parseAsync(xmlAsJson);

    const updated = await this.prisma.$executeRaw`
      INSERT INTO data_administration_context.jurisdictions (
        adr1,
        adr2,
        arrondissement,
        codejur,
        codepos,
        date_suppression,
        libelle,
        ressort,
        type_jur,
        ville_jur,
        ville
      )
      SELECT
        t.adr1,
        t.adr2,
        t.arrondissement,
        t.codejur,
        t.codepos,
        TO_DATE(t.date_suppression, 'DD/MM/YYYY'),
        t.libelle,
        t.ressort,
        t.type_jur,
        t.ville_jur,
        t.ville
      FROM JSONB_TO_RECORDSET(${JSON.stringify(juridictions)}::jsonb) AS t(adr1 TEXT, adr2 TEXT, arrondissement TEXT, codejur TEXT, codepos TEXT, date_suppression TEXT, libelle TEXT, ressort TEXT, type_jur TEXT, ville_jur TEXT, ville TEXT)
      ON CONFLICT (codejur) DO UPDATE SET
          adr1 = EXCLUDED.adr1,
          adr2 = EXCLUDED.adr2,
          arrondissement = EXCLUDED.arrondissement,
          codepos = EXCLUDED.codepos,
          date_suppression = EXCLUDED.date_suppression,
          libelle = EXCLUDED.libelle,
          ressort = EXCLUDED.ressort,
          type_jur = EXCLUDED.type_jur,
          ville_jur = EXCLUDED.ville_jur,
          ville = EXCLUDED.ville;
    `;

    return { updated };
  }
}

const LolfiJurisdictionSchema = z.object({
  adr1: z.string().nullish(),
  adr2: z.string().nullish(),
  arrondissement: z.string().nullish(),
  codejur: z.string().nonempty(),
  codepos: z.string().nullish(),
  date_suppression: z.string().regex(/\d\d\/\d\d\/\d{4}/),
  libelle: z.string(),
  ressort: z.string().nullish(),
  srj: z.string().nullish(),
  teleph: z.string().nullish(),
  type_jur: z.string().nonempty(),
  ville_jur: z.string().nullish(),
  ville: z.string().nullish(),
});

const LolfiJuridictionListSchema = z.object({
  lolfi: z.object({ juridictions: z.array(LolfiJurisdictionSchema) }),
});
