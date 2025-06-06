import { NestFactory } from '@nestjs/core';
import crypto from 'crypto';
import {
  allRulesTuple,
  Gender,
  Magistrat,
  NominationFile,
  Role,
  Transparency,
  TypeDeSaisine,
} from 'shared-models';
import { users } from 'src/identity-and-access-context/adapters/secondary/gateways/repositories/drizzle/schema';
import { ContenuPropositionDeNominationTransparenceV1 } from 'src/nominations-context/pp-gds/transparences/business-logic/models/proposition-de-nomination';
import {
  dossierDeNominationPm,
  sessionPm,
} from 'src/nominations-context/sessions/adapters/secondary/gateways/repositories/drizzle/schema';
import { DossierDeNominationSnapshot } from 'src/nominations-context/sessions/business-logic/models/dossier-de-nomination';
import { SessionSnapshot } from 'src/nominations-context/sessions/business-logic/models/session';
import { reports } from 'src/reports-context/adapters/secondary/gateways/repositories/drizzle/schema/report-pm';
import { reportRules } from 'src/reports-context/adapters/secondary/gateways/repositories/drizzle/schema/report-rule-pm';
import { SqlReportRuleRepository } from 'src/reports-context/adapters/secondary/gateways/repositories/drizzle/sql-report-rule.repository';
import { SqlReportRepository } from 'src/reports-context/adapters/secondary/gateways/repositories/drizzle/sql-report.repository';
import { NominationFileReport } from 'src/reports-context/business-logic/models/nomination-file-report';
import { ReportRule } from 'src/reports-context/business-logic/models/report-rules';
import { ReportRuleBuilder } from 'src/reports-context/business-logic/models/report-rules.builder';
import { ReportBuilder } from 'src/reports-context/business-logic/models/report.builder';
import { SharedKernelModule } from 'src/shared-kernel/adapters/primary/nestjs/shared-kernel.module';
import { DRIZZLE_DB } from 'src/shared-kernel/adapters/primary/nestjs/tokens';
import { DrizzleDb } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';

async function seed() {
  const app = await NestFactory.createApplicationContext(SharedKernelModule);

  try {
    const db = app.get(DRIZZLE_DB) as DrizzleDb;

    const lucUser: typeof users.$inferInsert = {
      id: 'f8e4f8e4-4f5b-4c8b-9b2d-e7b8a9d6e7b8',
      firstName: 'luc',
      lastName: 'denan',
      email: 'luc.denan@example.fr',
      role: Role.MEMBRE_DU_SIEGE,
      gender: Gender.M,
      // Unencrypted password is 'password+00'
      password: '$2b$10$ZsZ6Q01IdeksH/XkaZhzJuMLVCJC6TT2RbYkZ3oZDo85XkkOB5Ina',
    };

    const jeanUser: typeof users.$inferInsert = {
      id: '46f440ed-4421-4308-a65e-1241553a6cc4',
      firstName: 'jean',
      lastName: 'denan',
      email: 'jean@example.fr',
      role: Role.ADJOINT_SECRETAIRE_GENERAL,
      gender: Gender.M,
      // Unencrypted password is 'password+00'
      password: '$2b$10$ZsZ6Q01IdeksH/XkaZhzJuMLVCJC6TT2RbYkZ3oZDo85XkkOB5Ina',
    };

    await db.insert(users).values([lucUser, jeanUser]).execute();

    const sessionA: SessionSnapshot = {
      id: 'f474d12d-9a27-44c8-a90b-f233b131235c',
      name: Transparency.AUTOMNE_2024,
      formation: Magistrat.Formation.PARQUET,
      sessionImportéeId: '4ebd0b50-d2e8-484c-a18d-7531879118ca',
      typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS,
      version: 1,
    };
    await db.insert(sessionPm).values(sessionA).execute();

    const dossier1: DossierDeNominationSnapshot<
      TypeDeSaisine.TRANSPARENCE_GDS,
      ContenuPropositionDeNominationTransparenceV1
    > = {
      id: '4f275b00-e7f6-4a92-a52b-5a2514f0d2b3',
      sessionId: sessionA.id,
      nominationFileImportedId: '4fd1aae8-46ca-49f4-9abf-cf31238cad16',
      content: {
        biography: 'John Doe',
        birthDate: { day: 1, month: 1, year: 1980 },
        currentPosition: 'Current position',
        targettedPosition: 'Target position',
        dueDate: { day: 1, month: 6, year: 2023 },
        folderNumber: 1,
        formation: Magistrat.Formation.PARQUET,
        grade: Magistrat.Grade.I,
        name: 'Nominee Name',
        observers: [],
        rank: 'A',
        datePassageAuGrade: null,
        datePriseDeFonctionPosteActuel: {
          day: 1,
          month: 1,
          year: 2021,
        },
        informationCarrière: 'Carrière.',
      },
    };

    await db
      .insert(dossierDeNominationPm)
      .values({
        ...dossier1,
        dossierDeNominationImportéId: dossier1.nominationFileImportedId,
      })
      .execute();

    const reportSnapshot1 = new ReportBuilder('uuid')
      .with('version', 1)
      .with('dossierDeNominationId', dossier1.id)
      .with('sessionId', sessionA.id)
      .with('reporterId', lucUser.id!)
      .with('state', NominationFile.ReportState.IN_PROGRESS)
      .build();

    const reportRow1 = SqlReportRepository.mapToDb(
      NominationFileReport.fromSnapshot(reportSnapshot1),
    );
    await db.insert(reports).values(reportRow1).execute();

    const report1RulesPromises = allRulesTuple.map(
      async ([ruleGroup, ruleName]) => {
        const reportRule = new ReportRuleBuilder()
          .with('id', crypto.randomUUID())
          .with('reportId', reportSnapshot1.id)
          .with('ruleGroup', ruleGroup)
          .with('ruleName', ruleName)
          .with('validated', false)
          .build();

        const ruleRow = SqlReportRuleRepository.mapSnapshotToDb(reportRule);
        await db.insert(reportRules).values(ruleRow).execute();
      },
    );
    await Promise.all(report1RulesPromises);

    const reportSnapshot2 = new ReportBuilder('uuid')
      .with('id', crypto.randomUUID())
      .with('dossierDeNominationId', dossier1.id)
      .with('sessionId', sessionA.id)
      .with('reporterId', lucUser.id!)
      .with('version', 1)
      .with('formation', Magistrat.Formation.PARQUET)
      .with('state', NominationFile.ReportState.NEW)
      .with('comment', 'Commentaire')
      .build();

    const reportRow2 = SqlReportRepository.mapSnapshotToDb(reportSnapshot2);
    await db.insert(reports).values(reportRow2).execute();

    const report2RulesPromises = allRulesTuple.map(
      async ([ruleGroup, ruleName]) => {
        const reportRule = new ReportRuleBuilder()
          .with('id', crypto.randomUUID())
          .with('reportId', reportSnapshot2.id)
          .with('ruleGroup', ruleGroup)
          .with('ruleName', ruleName)
          .with('validated', true)
          .build();

        const ruleRow = SqlReportRuleRepository.mapToDb(
          ReportRule.fromSnapshot(reportRule),
        );
        await db.insert(reportRules).values(ruleRow).execute();
      },
    );
    await Promise.all(report2RulesPromises);
  } catch (error) {
    console.error(error);
    await app.close();
  } finally {
    await app.close();
  }
}
seed();
