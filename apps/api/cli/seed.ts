import { NestFactory } from '@nestjs/core';
import crypto from 'crypto';
import {
  allRulesTuple,
  Gender,
  Magistrat,
  NominationFile,
  Role,
  Transparency,
} from 'shared-models';
import { users } from 'src/identity-and-access-context/adapters/secondary/gateways/repositories/drizzle/schema';
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
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';

async function seed() {
  const app = await NestFactory.createApplicationContext(SharedKernelModule);

  try {
    const db = app.get(DRIZZLE_DB) as DrizzleDb;

    const user: typeof users.$inferInsert = {
      id: 'f8e4f8e4-4f5b-4c8b-9b2d-e7b8a9d6e7b8',
      firstName: 'luc',
      lastName: 'denan',
      email: 'luc.denan@example.fr',
      role: Role.MEMBRE_DU_SIEGE,
      gender: Gender.M,
      // Unencrypted password is 'password+00'
      password: '$2b$10$ZsZ6Q01IdeksH/XkaZhzJuMLVCJC6TT2RbYkZ3oZDo85XkkOB5Ina',
    };

    await db.insert(users).values(user).execute();

    const reportSnapshot1 = new ReportBuilder('uuid')
      .with('version', 1)
      .with('name', 'John Doe')
      .with('reporterId', user.id!)
      .with('transparency', Transparency.SIEGE_DU_06_FEVRIER_2025)
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
          .with('preValidated', false)
          .with('validated', false)
          .build();

        const ruleRow = SqlReportRuleRepository.mapSnapshotToDb(reportRule);
        await db.insert(reportRules).values(ruleRow).execute();
      },
    );
    await Promise.all(report1RulesPromises);

    const reportSnapshot2 = new ReportBuilder('uuid')
      .with('id', crypto.randomUUID())
      .with('reporterId', user.id!)
      .with('version', 1)
      .with('name', 'Ada Lovelace')
      .with('biography', '- Tribunal de grande instance de Paris')
      .with('birthDate', new DateOnly(1990, 1, 1))
      .with('dueDate', new DateOnly(2025, 10, 1))
      .with('formation', Magistrat.Formation.PARQUET)
      .with('grade', Magistrat.Grade.HH)
      .with('state', NominationFile.ReportState.NEW)
      .with('transparency', Transparency.AUTOMNE_2024)
      .with('currentPosition', 'Juge')
      .with('targettedPosition', 'Procureur')
      .with('comment', 'Commentaire')
      .with('rank', '(1 sur une liste de 100)')
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
          .with('preValidated', true)
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
