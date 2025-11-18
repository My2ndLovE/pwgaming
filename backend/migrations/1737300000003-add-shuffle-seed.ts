import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShuffleSeed1737300000003 implements MigrationInterface {
  name = 'AddShuffleSeed1737300000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add shuffle_seed column to game_hands table
    await queryRunner.query(`
      ALTER TABLE "game_hands"
      ADD COLUMN "shuffleSeed" varchar(128);
    `);

    // Add comment explaining the column's purpose
    await queryRunner.query(`
      COMMENT ON COLUMN "game_hands"."shuffleSeed" IS
      'Cryptographically secure random seed used for deck shuffle. Enables hand replay reconstruction.';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "game_hands"
      DROP COLUMN "shuffleSeed";
    `);
  }
}
