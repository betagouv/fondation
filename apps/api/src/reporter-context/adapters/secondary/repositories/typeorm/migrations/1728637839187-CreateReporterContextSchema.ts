import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReporterContextSchema1728637839187
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS reporter_context`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP SCHEMA IF EXISTS reporter_context CASCADE`);
  }
}
