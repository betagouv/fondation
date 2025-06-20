import { NestFactory } from '@nestjs/core';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { allRulesTuple, Magistrat, NominationFile, Role } from 'shared-models';
import { users } from 'src/identity-and-access-context/adapters/secondary/gateways/repositories/drizzle/schema';
import {
  affectationPm,
  dossierDeNominationPm,
  sessionPm,
} from 'src/nominations-context/sessions/adapters/secondary/gateways/repositories/drizzle/schema';
import { reports } from 'src/reports-context/adapters/secondary/gateways/repositories/drizzle/schema/report-pm';
import { reportRules } from 'src/reports-context/adapters/secondary/gateways/repositories/drizzle/schema/report-rule-pm';
import { SharedKernelModule } from 'src/shared-kernel/adapters/primary/nestjs/shared-kernel.module';
import { DRIZZLE_DB } from 'src/shared-kernel/adapters/primary/nestjs/tokens';
import { DrizzleDb } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';

async function affectationTranspaAuxPrésidents() {
  const app = await NestFactory.createApplicationContext(SharedKernelModule);

  try {
    const db = app.get(DRIZZLE_DB) as DrizzleDb;

    const sessionIdSiègeList = await db
      .select({ id: sessionPm.id })
      .from(sessionPm)
      .where(
        and(
          eq(sessionPm.name, 'balai'),
          eq(sessionPm.formation, Magistrat.Formation.SIEGE),
        ),
      )
      .execute();

    if (!sessionIdSiègeList.length)
      throw new Error(
        'No session found with name "balai" and formation "siege"',
      );
    if (sessionIdSiègeList.length > 1)
      throw new Error(
        'Multiple sessions found with name "balai" and formation "siege"',
      );
    const sessionIdSiège = sessionIdSiègeList[0]!.id;

    const sessionIdParquetList = await db
      .select({ id: sessionPm.id })
      .from(sessionPm)
      .where(
        and(
          eq(sessionPm.name, 'balai'),
          eq(sessionPm.formation, Magistrat.Formation.PARQUET),
        ),
      )
      .execute();

    if (!sessionIdParquetList.length)
      throw new Error(
        'No session found with name "balai" and formation "parquet"',
      );
    if (sessionIdParquetList.length > 1)
      throw new Error(
        'Multiple sessions found with name "balai" and formation "parquet"',
      );
    const sessionIdParquet = sessionIdParquetList[0]!.id;

    await db.transaction(async (tx) => {
      const présidentParquet = await tx
        .select()
        .from(users)
        .where(
          and(
            eq(users.firstName, 'rémy'),
            eq(users.lastName, 'heitz'),
            eq(users.role, Role.MEMBRE_DU_PARQUET),
          ),
        )
        .execute();
      if (!présidentParquet.length)
        throw new Error(
          'No user found with first name "rémy" and last name "heitz"',
        );
      if (présidentParquet.length > 1)
        throw new Error(
          'Multiple users found with first name "rémy" and last name "heitz"',
        );
      const présidentParquetId = présidentParquet[0]!.id;

      const présidentSiège = await tx
        .select()
        .from(users)
        .where(
          and(
            eq(users.firstName, 'christophe'),
            eq(users.lastName, 'soulard'),
            eq(users.role, Role.MEMBRE_DU_SIEGE),
          ),
        )
        .execute();
      if (!présidentSiège.length)
        throw new Error(
          'No user found with first name "christophe" and last name "soulard"',
        );
      if (présidentSiège.length > 1)
        throw new Error(
          'Multiple users found with first name "christophe" and last name "soulard"',
        );
      const présidentSiègeId = présidentSiège[0]!.id;

      for (const [formation, présidentReporterId, sessionId] of [
        [Magistrat.Formation.PARQUET, présidentParquetId, sessionIdParquet],
        [Magistrat.Formation.SIEGE, présidentSiègeId, sessionIdSiège],
      ] as const) {
        await affecterAUnPrésident(
          tx,
          formation,
          sessionId,
          présidentReporterId,
        );
      }

      await réaffecterDossiersSiège(tx, sessionIdSiège, présidentSiègeId);
    });
  } catch (error) {
    console.error(error);
    await app.close();
  } finally {
    await app.close();
  }
}

async function affecterAUnPrésident(
  tx: Parameters<Parameters<DrizzleDb['transaction']>[0]>[0],
  formation: Magistrat.Formation,
  sessionId: string,
  présidentReporterId: string,
) {
  const dossierIds = await tx
    .select({ id: dossierDeNominationPm.id })
    .from(dossierDeNominationPm)
    .where(
      formation === Magistrat.Formation.PARQUET
        ? eq(dossierDeNominationPm.sessionId, sessionId)
        : and(
            eq(dossierDeNominationPm.sessionId, sessionId),
            sql`content @> '{"grade": "HH"}'::jsonb`,
            sql`content->>'numeroDeDossier' >= '1' AND content->>'numeroDeDossier' <= '12'`,
          ),
    )
    .execute();
  if (formation === Magistrat.Formation.SIEGE && dossierIds.length !== 12)
    throw new Error(
      `Expected 12 dossiers for formation ${formation}, found ${dossierIds.length}. ${JSON.stringify(
        dossierIds,
      )}`,
    );

  await tx
    .update(affectationPm)
    .set({
      affectationsDossiersDeNominations: sql`
        array(
          select
            case 
             when elem->>'dossierDeNominationId' = any(ARRAY[${dossierIds.map((d) => `'${d.id}'`).join(',')}]::text[])
              then jsonb_build_object(
                'dossierDeNominationId', elem->>'dossierDeNominationId',
                'rapporteurIds', (
                  (elem->'rapporteurIds')::jsonb || jsonb_build_array('${présidentReporterId}'::text)
                )
              )
              else elem
            end
          from unnest("affectations_dossiers_de_nominations") as elem
        )
      `,
    })
    .where(eq(affectationPm.sessionId, sessionId))
    .execute();

  const existingReports = await tx
    .select()
    .from(reports)
    .where(
      and(
        inArray(
          reports.dossierDeNominationId,
          dossierIds.map((d) => d.id),
        ),
        eq(reports.formation, formation),
        eq(reports.sessionId, sessionId),
      ),
    )
    .execute();
  if (!existingReports.length)
    throw new Error(
      `No report found for formation ${formation} and session ID ${sessionId}`,
    );

  for (const existingReport of existingReports) {
    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      id,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      createdAt,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      comment,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      attachedFiles,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      version,
      reporterId,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      state,
      ...newValues
    } = existingReport;

    if (reporterId === présidentReporterId)
      throw new Error(
        `Report ${existingReport.id} already has the correct reporterId for the formation ${formation}`,
      );

    const newReportRaw = await tx
      .insert(reports)
      .values({
        ...newValues,
        version: 1,
        comment: null,
        attachedFiles: null,
        reporterId: présidentReporterId,
        state: NominationFile.ReportState.NEW,
      })
      .returning({
        id: reports.id,
      })
      .execute();
    if (!newReportRaw.length)
      throw new Error(`No new report created for report ${existingReport.id}`);
    const newReport = newReportRaw[0]!;

    const rules = await tx
      .select()
      .from(reportRules)
      .where(eq(reportRules.reportId, existingReport.id))
      .execute();
    if (!rules.length)
      throw new Error(`No rules found for report ${existingReport.id}`);
    if (rules.length !== allRulesTuple.length)
      throw new Error(
        `Report ${existingReport.id} has ${rules.length} rules, expected ${allRulesTuple.length}`,
      );

    await tx
      .insert(reportRules)
      .values(
        rules.map((r) => ({
          reportId: newReport.id,
          ruleGroup: r.ruleGroup,
          ruleName: r.ruleName,
          validated: true,
        })),
      )
      .execute();
  }
}

async function réaffecterDossiersSiège(
  tx: Parameters<Parameters<DrizzleDb['transaction']>[0]>[0],
  sessionId: string,
  ancienRapporteurId: string,
) {
  const formation = Magistrat.Formation.SIEGE;

  const nouveauRapporteurList = await tx
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.firstName, 'christian'),
        eq(users.lastName, 'vigouroux'),
        eq(users.role, Role.MEMBRE_COMMUN),
      ),
    )
    .execute();
  if (!nouveauRapporteurList.length)
    throw new Error(
      'No user found with first name "christian" and last name "vigouroux"',
    );
  if (nouveauRapporteurList.length > 1)
    throw new Error(
      'Multiple users found with first name "christian" and last name "vigouroux"',
    );
  const nouveauRapporteurId = nouveauRapporteurList[0]!.id;

  const dossiersMalAffectés = await tx
    .select({ id: dossierDeNominationPm.id })
    .from(dossierDeNominationPm)
    .where(
      and(
        eq(dossierDeNominationPm.sessionId, sessionId),
        sql`content->>'numeroDeDossier' >= '83' AND content->>'numeroDeDossier' <= '89'`,
      ),
    )
    .execute();

  if (!dossiersMalAffectés.length) {
    throw new Error(
      `No dossiers found with numeroDeDossier between 83 and 89 for formation ${formation}`,
    );
  }
  if (dossiersMalAffectés.length !== 7) {
    throw new Error(
      `Expected 7 dossiers with numeroDeDossier between 83 and 89, found ${dossiersMalAffectés.length}`,
    );
  }

  console.log(`Found ${dossiersMalAffectés.length} dossiers to reassign`);

  await tx
    .update(affectationPm)
    .set({
      affectationsDossiersDeNominations: sql`
        array(
          select 
            case 
              when elem->>'dossierDeNominationId' = any(ARRAY[${dossiersMalAffectés.map((d) => `'${d.id}'`).join(',')}]::text[])
              then jsonb_build_object(
                'dossierDeNominationId', elem->>'dossierDeNominationId',
                'rapporteurIds', jsonb_build_array('${nouveauRapporteurId}'::text)
              )
              else elem
            end
          from unnest("affectations_dossiers_de_nominations") as elem
        )
      `,
    })
    .where(eq(affectationPm.sessionId, sessionId))
    .execute();

  const existingReports = await tx
    .select()
    .from(reports)
    .where(
      and(
        inArray(
          reports.dossierDeNominationId,
          dossiersMalAffectés.map((d) => d.id),
        ),
        eq(reports.reporterId, ancienRapporteurId),
        eq(reports.formation, formation),
        eq(reports.sessionId, sessionId),
      ),
    )
    .execute();

  if (!existingReports.length) {
    throw new Error(
      `No reports found for the special dossiers in formation ${formation}`,
    );
  }

  // 4. Create new reports for these dossiers with the new rapporteur
  for (const existingReport of existingReports) {
    const {
      id,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      createdAt,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      comment,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      attachedFiles,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      version,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      reporterId,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      state,
      ...newValues
    } = existingReport;

    const newReportRaw = await tx
      .insert(reports)
      .values({
        ...newValues,
        version: 1,
        comment: null,
        attachedFiles: null,
        reporterId: nouveauRapporteurId,
        state: NominationFile.ReportState.NEW,
      })
      .returning({
        id: reports.id,
      })
      .execute();

    if (!newReportRaw.length) {
      throw new Error(`No new report created for special dossier report ${id}`);
    }
    const newReport = newReportRaw[0]!;

    const rules = await tx
      .select()
      .from(reportRules)
      .where(eq(reportRules.reportId, id))
      .execute();

    if (!rules.length) {
      throw new Error(`No rules found for report ${id}`);
    }

    await tx
      .insert(reportRules)
      .values(
        rules.map((r) => ({
          reportId: newReport.id,
          ruleGroup: r.ruleGroup,
          ruleName: r.ruleName,
          validated: true,
        })),
      )
      .execute();

    console.log(
      `Created new report ${newReport.id} for dossier, reassigned from ${id}`,
    );

    await tx
      .delete(reportRules)
      .where(eq(reportRules.reportId, existingReport.id))
      .execute();
    console.log(`Deleted old report rules of report ID ${existingReport.id}`);
    await tx.delete(reports).where(eq(reports.id, existingReport.id)).execute();
    console.log(`Deleted old report ${existingReport.id}`);
  }
}

affectationTranspaAuxPrésidents();
