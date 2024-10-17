import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateNominationFile1729182627100 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        schema: 'data_administrator_context',
        name: 'nomination_files',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'row_number',
            type: 'int4',
            isNullable: false,
          },
          {
            name: 'report_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'content',
            type: 'jsonb',
            isNullable: false,
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('data_administrator_context.nomination_files');
  }
}
