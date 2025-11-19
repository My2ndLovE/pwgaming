import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * T060-T064: Add composite indexes for transaction queries
 *
 * Index 1: (userId, type, createdAt) - For user transaction history filtering by type
 * Index 2: (referenceId, createdAt) - For room/game transaction history
 *
 * Using CONCURRENTLY to avoid locking production tables during index creation
 */
export class AddTransactionIndexes1737284000000 implements MigrationInterface {
  name = 'AddTransactionIndexes1737284000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // T061: CREATE INDEX CONCURRENTLY for (userId, type, createdAt)
    // This index supports queries like: "Get all GAME_BUYIN transactions for user X ordered by date"
    await queryRunner.query(
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_transaction_user_type_created"
       ON "transaction" ("userId", "type", "createdAt" DESC)`
    );

    // T062: CREATE INDEX CONCURRENTLY for (referenceId, createdAt)
    // This index supports queries like: "Get all transactions for room Y ordered by date"
    await queryRunner.query(
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_transaction_reference_created"
       ON "transaction" ("referenceId", "createdAt" DESC)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // T063: DROP INDEX statements
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_transaction_reference_created"`
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_transaction_user_type_created"`
    );
  }
}
