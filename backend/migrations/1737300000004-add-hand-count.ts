import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddHandCount1737300000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'rooms',
      new TableColumn({
        name: 'handCount',
        type: 'int',
        default: 0,
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('rooms', 'handCount');
  }
}
