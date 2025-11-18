import { DataSource } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import * as path from 'path';

describe('Database Migrations (Rollback Testing)', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
      ],
    }).compile();

    // Create a test data source
    dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || 'poker_test',
      migrations: [path.join(__dirname, '../../../migrations/*.ts')],
      synchronize: false,
      logging: false,
    });
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  describe('Migration Rollback Tests', () => {
    it('should successfully run all migrations', async () => {
      await dataSource.initialize();
      const pendingMigrations = await dataSource.showMigrations();

      if (pendingMigrations) {
        const migrations = await dataSource.runMigrations();
        expect(migrations).toBeDefined();
        expect(Array.isArray(migrations)).toBe(true);
      }
    });

    it('should successfully rollback the last migration', async () => {
      if (!dataSource.isInitialized) {
        await dataSource.initialize();
      }

      // Get current migrations
      const executedMigrations = await dataSource.query(
        `SELECT * FROM "migrations" ORDER BY "timestamp" DESC LIMIT 1`,
      );

      if (executedMigrations.length > 0) {
        // Rollback last migration
        await dataSource.undoLastMigration();

        // Verify rollback
        const afterRollback = await dataSource.query(
          `SELECT * FROM "migrations" ORDER BY "timestamp" DESC LIMIT 1`,
        );

        // If there were migrations, the last one should be different now
        if (executedMigrations.length > 0) {
          expect(afterRollback[0]?.timestamp).not.toBe(
            executedMigrations[0].timestamp,
          );
        }
      }
    });

    it('should successfully re-run migrations after rollback', async () => {
      if (!dataSource.isInitialized) {
        await dataSource.initialize();
      }

      // Run migrations again
      const migrations = await dataSource.runMigrations();
      expect(migrations).toBeDefined();
      expect(Array.isArray(migrations)).toBe(true);
    });

    it('should verify all tables exist after migrations', async () => {
      if (!dataSource.isInitialized) {
        await dataSource.initialize();
      }

      const tables = await dataSource.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `);

      const tableNames = tables.map(
        (t: { table_name: string }) => t.table_name,
      );

      // Verify critical tables exist
      expect(tableNames).toContain('users');
      expect(tableNames).toContain('rooms');
      expect(tableNames).toContain('transactions');
      expect(tableNames).toContain('game_hands');
      expect(tableNames).toContain('player_seats');
      expect(tableNames).toContain('betting_actions');
      expect(tableNames).toContain('audit_logs');
      expect(tableNames).toContain('platform_settings');
      expect(tableNames).toContain('rake_history');
      expect(tableNames).toContain('migrations');
    });

    it('should verify all indexes exist', async () => {
      if (!dataSource.isInitialized) {
        await dataSource.initialize();
      }

      const indexes = await dataSource.query(`
        SELECT
          tablename,
          indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname;
      `);

      const indexNames = indexes.map((i: { indexname: string }) => i.indexname);

      // Verify critical performance indexes exist
      expect(indexNames).toContain('idx_user_telegram_id');
      expect(indexNames).toContain('idx_transaction_user_id');
      expect(indexNames).toContain('idx_room_status');
      expect(indexNames).toContain('idx_game_hands_room_completed');
      expect(indexNames).toContain('idx_betting_actions_hand_sequence');
      expect(indexNames).toContain('idx_rake_history_hand_id');
    });

    it('should verify platform_settings has seed data', async () => {
      if (!dataSource.isInitialized) {
        await dataSource.initialize();
      }

      const settings = await dataSource.query(
        `SELECT * FROM "platform_settings" LIMIT 1`,
      );

      expect(settings).toBeDefined();
      expect(settings.length).toBeGreaterThan(0);
      expect(settings[0].defaultSmallBlind).toBeDefined();
      expect(settings[0].defaultBigBlind).toBeDefined();
      expect(settings[0].maxRoomSize).toBe(9);
      expect(settings[0].actionTimerSeconds).toBe(30);
    });

    it('should verify enums are created', async () => {
      if (!dataSource.isInitialized) {
        await dataSource.initialize();
      }

      const enums = await dataSource.query(`
        SELECT typname
        FROM pg_type
        WHERE typtype = 'e'
        ORDER BY typname;
      `);

      const enumNames = enums.map((e: { typname: string }) => e.typname);

      expect(enumNames).toContain('user_role_enum');
      expect(enumNames).toContain('user_status_enum');
      expect(enumNames).toContain('transaction_type_enum');
      expect(enumNames).toContain('transaction_status_enum');
      expect(enumNames).toContain('room_status_enum');
      expect(enumNames).toContain('hand_phase_enum');
      expect(enumNames).toContain('seat_status_enum');
      expect(enumNames).toContain('action_type_enum');
    });
  });

  describe('Migration Integrity Tests', () => {
    it('should not allow duplicate migration runs', async () => {
      if (!dataSource.isInitialized) {
        await dataSource.initialize();
      }

      // Try to run migrations again (should be idempotent)
      const migrations = await dataSource.runMigrations();

      // No new migrations should run if already executed
      expect(migrations.length).toBe(0);
    });

    it('should maintain referential integrity', async () => {
      if (!dataSource.isInitialized) {
        await dataSource.initialize();
      }

      const constraints = await dataSource.query(`
        SELECT
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
        ORDER BY tc.table_name;
      `);

      // Verify critical foreign keys exist
      expect(constraints.length).toBeGreaterThan(0);

      const constraintNames = constraints.map(
        (c: { constraint_name: string }) => c.constraint_name,
      );

      expect(constraintNames).toContain('fk_transaction_user');
      expect(constraintNames).toContain('fk_room_creator');
      expect(constraintNames).toContain('fk_hand_room');
    });
  });
});
