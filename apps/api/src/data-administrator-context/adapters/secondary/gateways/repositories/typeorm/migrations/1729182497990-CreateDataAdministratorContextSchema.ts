import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDataAdministratorContextSchema1729182497990
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE SCHEMA IF NOT EXISTS data_administrator_context`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP SCHEMA IF EXISTS data_administrator_context CASCADE`,
    );
  }
}
