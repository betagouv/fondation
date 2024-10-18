import {
  Magistrat,
  NominationFile,
  rulesTuple,
  Transparency,
} from '@/shared-models';
import { NestFactory } from '@nestjs/core';
import { ReportPm } from 'src/reporter-context/adapters/secondary/repositories/typeorm/entities/report-pm';
import { ReportRulePm } from 'src/reporter-context/adapters/secondary/repositories/typeorm/entities/report-rule-pm';
import { ReportBuilder } from 'src/reporter-context/business-logic/models/report.builder';
import {
  DATA_SOURCE,
  SharedKernelModule,
} from 'src/shared-kernel/adapters/primary/nestjs/shared-kernel.module';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { DataSource } from 'typeorm';

async function seed() {
  const app = await NestFactory.createApplicationContext(SharedKernelModule);
  try {
    const dataSource = app.get(DATA_SOURCE) as DataSource;
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }

    const report1 = await dataSource
      .getRepository(ReportPm)
      .save(
        ReportPm.fromDomain(
          new ReportBuilder()
            .withId(crypto.randomUUID())
            .withName('John Doe')
            .build(),
        ),
      );
    const report1RulesPromises = rulesTuple.map(
      async ([ruleGroup, ruleName]) => {
        await dataSource
          .getRepository(ReportRulePm)
          .save(
            new ReportRulePm(
              crypto.randomUUID(),
              ruleGroup,
              ruleName,
              false,
              false,
              '',
              report1.id,
            ),
          );
      },
    );
    await Promise.all(report1RulesPromises);

    const report2 = await dataSource.getRepository(ReportPm).save(
      ReportPm.fromDomain(
        new ReportBuilder()
          .withId(crypto.randomUUID())
          .withName('Ada Lovelace')
          .withBiography('- Tribunal de grande instance de Paris')
          .withBirthDate(new DateOnly(1990, 1, 1))
          .withDueDate(new DateOnly(2025, 10, 1))
          .withFormation(Magistrat.Formation.PARQUET)
          .withGrade(Magistrat.Grade.HH)
          .withState(NominationFile.ReportState.OPINION_RETURNED)
          .withTransparency(Transparency.AUTOMNE_2024)
          .withCurrentPosition('Juge')
          .withTargettedPosition('Procureur')
          .withComment('Commentaire')
          .withRank('(1 sur une liste de 100)')
          .build(),
      ),
    );
    const report2RulesPromises = rulesTuple.map(
      async ([ruleGroup, ruleName]) => {
        await dataSource
          .getRepository(ReportRulePm)
          .save(
            new ReportRulePm(
              crypto.randomUUID(),
              ruleGroup,
              ruleName,
              true,
              true,
              '',
              report2.id,
            ),
          );
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
