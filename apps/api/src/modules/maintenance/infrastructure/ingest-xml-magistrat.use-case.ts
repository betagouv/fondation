import { Injectable } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';
import { z } from 'zod';
import { PrismaService } from 'src/modules/framework/database';

@Injectable()
export class IngestXmlMagistrat {
  constructor(private readonly prisma: PrismaService) {}

  async execute(document: Buffer): Promise<{ updated: number }> {
    // TODO : centraliser cette fonction parmi les use case d'ingestion?
    const parser = new XMLParser({
      numberParseOptions: { skipLike: /.+/, hex: false, leadingZeros: false },
    });
    const xmlAsJson = parser.parse(document.toString('latin1'));

    const parsed = await LolfiMagistratListSchema.parseAsync(xmlAsJson);

    const rawMagistrats = parsed.lolfi.magistrats;
    const magistratsArray = Array.isArray(rawMagistrats)
      ? rawMagistrats
      : [rawMagistrats];

    const magistrats = magistratsArray.map((m) => ({
      external_id: String(m.id),
      civilite: m.civilite,
      last_name: m.nom,
      first_name: m.prenom,
      married_name: m.nom_marital ?? null,
      used_name: m.nom_usage,
      marital_status: m.sit_fam ?? null,
      professional_email: m.email_pro ?? null,
      birth_date: m.date_naiss ?? null,
      birth_place: m.lieu_naiss ?? null,
      birth_department: m.dep_naiss ?? null,
      grade: m.grade === 'II-N' ? 'II' : (m.grade ?? null),
      grade_date: m.date_grade ?? null,
      current_position_id: m.num_emploi_cible ?? null,
      installation_date: m.date_installation ?? null,
      nomination_date: m.date_nomination ?? null,
      advancement_year: m.tableau ?? null,
      career_history: m.historique ?? null,
      admin_position: m.posad ?? null,
      admin_position_prev: m.posad_prev ?? null,
      admin_position_prev_start: m.date_posad_prev ?? null,
      admin_position_prev_end: m.date_posad_prev_fin ?? null,
      admin_position_prev2: m.posad_prev2 ?? null,
      admin_position_prev2_date: m.date_posad_prev2 ?? null,
      lolfi_updated_at: m.date_modification ?? null,
    }));

    const updated = await this.prisma.$executeRaw`
      INSERT INTO nominations_context.magistrat (
        external_id,
        civilite,
        last_name,
        first_name,
        married_name,
        used_name,
        marital_status,
        professional_email,
        birth_date,
        birth_place,
        birth_department,
        grade,
        grade_date,
        current_position_id,
        installation_date,
        nomination_date,
        advancement_year,
        career_history,
        admin_position,
        admin_position_prev,
        admin_position_prev_start,
        admin_position_prev_end,
        admin_position_prev2,
        admin_position_prev2_date,
        lolfi_updated_at,
        updated_at
      )
      SELECT
        t.external_id,
        t.civilite,
        t.last_name,
        t.first_name,
        t.married_name,
        t.used_name,
        t.marital_status,
        t.professional_email,
        TO_DATE(NULLIF(t.birth_date, ''), 'DD/MM/YYYY'),
        t.birth_place,
        t.birth_department,
        t.grade,
        TO_DATE(NULLIF(t.grade_date, ''), 'DD/MM/YYYY'),
        t.current_position_id,
        TO_DATE(NULLIF(t.installation_date, ''), 'DD/MM/YYYY'),
        TO_DATE(NULLIF(t.nomination_date, ''), 'DD/MM/YYYY'),
        NULLIF(t.advancement_year, '')::INTEGER,
        t.career_history,
        t.admin_position,
        t.admin_position_prev,
        TO_DATE(NULLIF(t.admin_position_prev_start, ''), 'DD/MM/YYYY'),
        TO_DATE(NULLIF(t.admin_position_prev_end, ''), 'DD/MM/YYYY'),
        t.admin_position_prev2,
        TO_DATE(NULLIF(t.admin_position_prev2_date, ''), 'DD/MM/YYYY'),
        TO_DATE(NULLIF(t.lolfi_updated_at, ''), 'DD/MM/YYYY'),
        NOW()
      FROM JSONB_TO_RECORDSET(${JSON.stringify(magistrats)}::jsonb) AS t(
        external_id TEXT,
        civilite TEXT,
        last_name TEXT,
        first_name TEXT,
        married_name TEXT,
        used_name TEXT,
        marital_status TEXT,
        professional_email TEXT,
        birth_date TEXT,
        birth_place TEXT,
        birth_department TEXT,
        grade TEXT,
        grade_date TEXT,
        current_position_id TEXT,
        installation_date TEXT,
        nomination_date TEXT,
        advancement_year TEXT,
        career_history TEXT,
        admin_position TEXT,
        admin_position_prev TEXT,
        admin_position_prev_start TEXT,
        admin_position_prev_end TEXT,
        admin_position_prev2 TEXT,
        admin_position_prev2_date TEXT,
        lolfi_updated_at TEXT
      )
      ON CONFLICT (external_id) DO UPDATE SET
        civilite = EXCLUDED.civilite,
        last_name = EXCLUDED.last_name,
        first_name = EXCLUDED.first_name,
        married_name = EXCLUDED.married_name,
        used_name = EXCLUDED.used_name,
        marital_status = EXCLUDED.marital_status,
        professional_email = EXCLUDED.professional_email,
        birth_date = EXCLUDED.birth_date,
        birth_place = EXCLUDED.birth_place,
        birth_department = EXCLUDED.birth_department,
        grade = EXCLUDED.grade,
        grade_date = EXCLUDED.grade_date,
        current_position_id = EXCLUDED.current_position_id,
        installation_date = EXCLUDED.installation_date,
        nomination_date = EXCLUDED.nomination_date,
        advancement_year = EXCLUDED.advancement_year,
        career_history = EXCLUDED.career_history,
        admin_position = EXCLUDED.admin_position,
        admin_position_prev = EXCLUDED.admin_position_prev,
        admin_position_prev_start = EXCLUDED.admin_position_prev_start,
        admin_position_prev_end = EXCLUDED.admin_position_prev_end,
        admin_position_prev2 = EXCLUDED.admin_position_prev2,
        admin_position_prev2_date = EXCLUDED.admin_position_prev2_date,
        lolfi_updated_at = EXCLUDED.lolfi_updated_at,
        updated_at = NOW();
    `;

    return { updated };
  }
}

const LolfiMagistratSchema = z.object({
  id: z.union([z.string(), z.number()]),
  civilite: z.string(),
  nom: z.string(),
  prenom: z.string(),
  nom_marital: z.string().nullish(),
  nom_usage: z.string(),
  sit_fam: z.string().nullish(),
  email_pro: z.string().nullish(),
  date_naiss: z.string().nullish(),
  lieu_naiss: z.string().nullish(),
  dep_naiss: z.string().nullish(),
  grade: z.string().nullish(),
  date_grade: z.string().nullish(),
  num_emploi_cible: z.string().nullish(),
  date_installation: z.string().nullish(),
  date_nomination: z.string().nullish(),
  tableau: z.string().nullish(),
  historique: z.string().nullish(),
  posad: z.string().nullish(),
  posad_prev: z.string().nullish(),
  date_posad_prev: z.string().nullish(),
  date_posad_prev_fin: z.string().nullish(),
  posad_prev2: z.string().nullish(),
  date_posad_prev2: z.string().nullish(),
  date_modification: z.string().nullish(),
});

const LolfiMagistratListSchema = z.object({
  lolfi: z.object({
    magistrats: z.union([z.array(LolfiMagistratSchema), LolfiMagistratSchema]),
  }),
});
