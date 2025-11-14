import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1705276800000 implements MigrationInterface {
  name = 'InitialSchema1705276800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums
    await queryRunner.query(`
      CREATE TYPE "user_role_enum" AS ENUM('player', 'admin');
      CREATE TYPE "user_status_enum" AS ENUM('active', 'suspended', 'banned');
      CREATE TYPE "transaction_type_enum" AS ENUM('deposit', 'withdrawal', 'game_win', 'game_loss', 'admin_adjustment');
      CREATE TYPE "transaction_status_enum" AS ENUM('pending', 'processing', 'completed', 'rejected', 'failed');
      CREATE TYPE "room_status_enum" AS ENUM('waiting', 'active', 'completed', 'suspended');
      CREATE TYPE "hand_phase_enum" AS ENUM('preflop', 'flop', 'turn', 'river', 'showdown', 'completed');
      CREATE TYPE "seat_status_enum" AS ENUM('active', 'folded', 'all_in', 'disconnected', 'sitting_out');
      CREATE TYPE "action_type_enum" AS ENUM('fold', 'check', 'call', 'bet', 'raise', 'all_in');
      CREATE TYPE "event_type_enum" AS ENUM('user_suspended', 'user_banned', 'user_reactivated', 'withdrawal_approved', 'withdrawal_rejected', 'deposit_approved', 'deposit_rejected', 'room_suspended', 'room_closed', 'settings_updated', 'admin_login', 'balance_adjustment');
      CREATE TYPE "entity_type_enum" AS ENUM('user', 'room', 'transaction', 'game', 'settings');
    `);

    // Users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "telegramId" bigint NOT NULL UNIQUE,
        "username" varchar(255) NOT NULL,
        "avatarUrl" varchar(500),
        "balance" decimal(15,2) NOT NULL DEFAULT 0,
        "role" user_role_enum NOT NULL DEFAULT 'player',
        "status" user_status_enum NOT NULL DEFAULT 'active',
        "suspensionReason" varchar(1000),
        "lastLogin" timestamp,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      );

      CREATE INDEX "idx_user_telegram_id" ON "users"("telegramId");
      CREATE INDEX "idx_user_username" ON "users"("username");
      CREATE INDEX "idx_user_status" ON "users"("status");
      CREATE INDEX "idx_user_created_at" ON "users"("createdAt");
    `);

    // Rooms table
    await queryRunner.query(`
      CREATE TABLE "rooms" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(255) NOT NULL,
        "smallBlind" decimal(15,2) NOT NULL,
        "bigBlind" decimal(15,2) NOT NULL,
        "minBuyIn" decimal(15,2) NOT NULL,
        "maxBuyIn" decimal(15,2) NOT NULL,
        "maxPlayers" int NOT NULL DEFAULT 9,
        "currentPlayers" int NOT NULL DEFAULT 0,
        "status" room_status_enum NOT NULL DEFAULT 'waiting',
        "createdBy" uuid NOT NULL,
        "suspensionReason" varchar(1000),
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "fk_room_creator" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE
      );

      CREATE INDEX "idx_room_status" ON "rooms"("status");
      CREATE INDEX "idx_room_created_at" ON "rooms"("createdAt");
      CREATE INDEX "idx_room_created_by" ON "rooms"("createdBy");
      CREATE INDEX "idx_room_status_created" ON "rooms"("status", "createdAt");
    `);

    // Transactions table
    await queryRunner.query(`
      CREATE TABLE "transactions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "type" transaction_type_enum NOT NULL,
        "amount" decimal(15,2) NOT NULL,
        "balanceBefore" decimal(15,2) NOT NULL,
        "balanceAfter" decimal(15,2) NOT NULL,
        "status" transaction_status_enum NOT NULL DEFAULT 'pending',
        "referenceId" varchar(255),
        "notes" varchar(1000),
        "processedBy" uuid,
        "processedAt" timestamp,
        "isImmutable" boolean NOT NULL DEFAULT false,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "fk_transaction_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_transaction_processor" FOREIGN KEY ("processedBy") REFERENCES "users"("id") ON DELETE SET NULL
      );

      CREATE INDEX "idx_transaction_user_id" ON "transactions"("userId");
      CREATE INDEX "idx_transaction_type_status" ON "transactions"("type", "status");
      CREATE INDEX "idx_transaction_created_at" ON "transactions"("createdAt");
      CREATE INDEX "idx_transaction_user_created" ON "transactions"("userId", "createdAt");
      CREATE INDEX "idx_transaction_reference_id" ON "transactions"("referenceId");
    `);

    // Game hands table
    await queryRunner.query(`
      CREATE TABLE "game_hands" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "roomId" uuid NOT NULL,
        "handNumber" int NOT NULL,
        "smallBlind" decimal(15,2) NOT NULL,
        "bigBlind" decimal(15,2) NOT NULL,
        "dealerPosition" int NOT NULL,
        "communityCards" jsonb,
        "potAmount" decimal(15,2) NOT NULL DEFAULT 0,
        "winners" jsonb,
        "players" jsonb NOT NULL,
        "actions" jsonb,
        "currentPhase" hand_phase_enum NOT NULL DEFAULT 'preflop',
        "startedAt" timestamp NOT NULL,
        "completedAt" timestamp,
        "durationSeconds" int,
        CONSTRAINT "fk_game_hand_room" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE
      );

      CREATE INDEX "idx_game_hand_room_id" ON "game_hands"("roomId");
      CREATE INDEX "idx_game_hand_started_at" ON "game_hands"("startedAt");
      CREATE INDEX "idx_game_hand_room_started" ON "game_hands"("roomId", "startedAt");
      CREATE INDEX "idx_game_hand_players" ON "game_hands" USING GIN("players");
    `);

    // Player seats table
    await queryRunner.query(`
      CREATE TABLE "player_seats" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "gameHandId" uuid NOT NULL,
        "position" int NOT NULL,
        "userId" uuid NOT NULL,
        "chipStack" decimal(15,2) NOT NULL,
        "currentBet" decimal(15,2) NOT NULL DEFAULT 0,
        "holeCardsEncrypted" bytea,
        "status" seat_status_enum NOT NULL DEFAULT 'active',
        "hasActed" boolean NOT NULL DEFAULT false,
        "lastActionAt" timestamp,
        CONSTRAINT "fk_player_seat_game_hand" FOREIGN KEY ("gameHandId") REFERENCES "game_hands"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_player_seat_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      );

      CREATE INDEX "idx_player_seat_game_hand_id" ON "player_seats"("gameHandId");
      CREATE INDEX "idx_player_seat_user_id" ON "player_seats"("userId");
      CREATE UNIQUE INDEX "idx_player_seat_game_position" ON "player_seats"("gameHandId", "position");
    `);

    // Betting actions table
    await queryRunner.query(`
      CREATE TABLE "betting_actions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "gameHandId" uuid NOT NULL,
        "playerId" uuid NOT NULL,
        "position" int NOT NULL,
        "action" action_type_enum NOT NULL,
        "amount" decimal(15,2) NOT NULL DEFAULT 0,
        "phase" hand_phase_enum NOT NULL,
        "sequenceNumber" int NOT NULL,
        "chipStackBefore" decimal(15,2) NOT NULL,
        "chipStackAfter" decimal(15,2) NOT NULL,
        "timeToActMs" int NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "fk_betting_action_game_hand" FOREIGN KEY ("gameHandId") REFERENCES "game_hands"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_betting_action_player" FOREIGN KEY ("playerId") REFERENCES "users"("id") ON DELETE CASCADE
      );

      CREATE INDEX "idx_betting_action_game_hand_id" ON "betting_actions"("gameHandId");
      CREATE INDEX "idx_betting_action_player_id" ON "betting_actions"("playerId");
      CREATE INDEX "idx_betting_action_game_sequence" ON "betting_actions"("gameHandId", "sequenceNumber");
      CREATE INDEX "idx_betting_action_created_at" ON "betting_actions"("createdAt");
    `);

    // Audit logs table
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "eventType" event_type_enum NOT NULL,
        "entityType" entity_type_enum NOT NULL,
        "entityId" uuid NOT NULL,
        "userId" uuid,
        "action" varchar(255) NOT NULL,
        "changes" jsonb,
        "ipAddress" inet,
        "userAgent" varchar(500),
        "serverNode" varchar(100),
        "createdAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "fk_audit_log_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL
      );

      CREATE INDEX "idx_audit_log_entity" ON "audit_logs"("entityType", "entityId");
      CREATE INDEX "idx_audit_log_user_id" ON "audit_logs"("userId");
      CREATE INDEX "idx_audit_log_created_at" ON "audit_logs"("createdAt");
      CREATE INDEX "idx_audit_log_event_type" ON "audit_logs"("eventType");
    `);

    // Platform settings table
    await queryRunner.query(`
      CREATE TABLE "platform_settings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "defaultSmallBlind" decimal(15,2) NOT NULL DEFAULT 0.5,
        "defaultBigBlind" decimal(15,2) NOT NULL DEFAULT 1.0,
        "maxRoomSize" int NOT NULL DEFAULT 9,
        "actionTimerSeconds" int NOT NULL DEFAULT 30,
        "disconnectTimeoutSeconds" int NOT NULL DEFAULT 60,
        "minDepositAmount" decimal(15,2) NOT NULL DEFAULT 10,
        "maxDepositAmount" decimal(15,2) NOT NULL DEFAULT 10000,
        "minWithdrawalAmount" decimal(15,2) NOT NULL DEFAULT 10,
        "maxWithdrawalAmount" decimal(15,2) NOT NULL DEFAULT 5000,
        "withdrawalFeePercent" decimal(5,2) NOT NULL DEFAULT 0,
        "maintenanceMode" boolean NOT NULL DEFAULT false,
        "maintenanceMessage" varchar(1000),
        "announcementBanner" varchar(500),
        "rateLimitPerMinute" int NOT NULL DEFAULT 100,
        "allowNewRegistrations" boolean NOT NULL DEFAULT true,
        "allowRoomCreation" boolean NOT NULL DEFAULT true,
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        "updatedBy" uuid
      );

      INSERT INTO "platform_settings" ("id") VALUES (gen_random_uuid());
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "platform_settings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "betting_actions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "player_seats"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "game_hands"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "transactions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "rooms"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "entity_type_enum";
      DROP TYPE IF EXISTS "event_type_enum";
      DROP TYPE IF EXISTS "action_type_enum";
      DROP TYPE IF EXISTS "seat_status_enum";
      DROP TYPE IF EXISTS "hand_phase_enum";
      DROP TYPE IF EXISTS "room_status_enum";
      DROP TYPE IF EXISTS "transaction_status_enum";
      DROP TYPE IF EXISTS "transaction_type_enum";
      DROP TYPE IF EXISTS "user_status_enum";
      DROP TYPE IF EXISTS "user_role_enum";
    `);
  }
}
