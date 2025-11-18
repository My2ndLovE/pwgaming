import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1737300000000 implements MigrationInterface {
  name = 'AddPerformanceIndexes1737300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Performance indexes for game_hands table
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_game_hands_room_completed"
      ON "game_hands"("roomId", "completedAt")
      WHERE "completedAt" IS NOT NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_game_hands_created_at"
      ON "game_hands"("createdAt" DESC);
    `);

    // Performance indexes for player_seats table
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_player_seats_hand_user"
      ON "player_seats"("handId", "userId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_player_seats_user_created"
      ON "player_seats"("userId", "createdAt" DESC);
    `);

    // Performance indexes for betting_actions table
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_betting_actions_hand_sequence"
      ON "betting_actions"("handId", "sequenceNumber");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_betting_actions_hand_phase"
      ON "betting_actions"("handId", "phase");
    `);

    // Performance index for transactions by status and created date
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_transactions_status_created"
      ON "transactions"("status", "createdAt" DESC);
    `);

    // Performance index for rake_history
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_rake_history_hand_id"
      ON "rake_history"("handId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_rake_history_created_at"
      ON "rake_history"("createdAt" DESC);
    `);

    // Composite index for audit_logs
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_audit_logs_entity_event"
      ON "audit_logs"("entityType", "eventType", "createdAt" DESC);
    `);

    // Partial index for active rooms (most queried)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_rooms_active"
      ON "rooms"("status", "currentPlayers", "maxPlayers")
      WHERE "status" IN ('waiting', 'active');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_rooms_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_audit_logs_entity_event"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_rake_history_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_rake_history_hand_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_transactions_status_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_betting_actions_hand_phase"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_betting_actions_hand_sequence"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_player_seats_user_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_player_seats_hand_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_game_hands_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_game_hands_room_completed"`);
  }
}
