import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWalletGameIntegration1737216000000 implements MigrationInterface {
  name = 'AddWalletGameIntegration1737216000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add gateway fields for external wallet mode (future)
    await queryRunner.query(`
      ALTER TABLE transactions
      ADD COLUMN IF NOT EXISTS gateway_reference VARCHAR(255) NULL,
      ADD COLUMN IF NOT EXISTS gateway_status VARCHAR(50) NULL
    `);

    // Add comment for clarity
    await queryRunner.query(`
      COMMENT ON COLUMN transactions.gateway_reference IS 'Payment gateway transaction ID (NULL for internal mode)';
      COMMENT ON COLUMN transactions.gateway_status IS 'Payment gateway status (NULL for internal mode)';
    `);

    // Add index for gateway lookups
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_transaction_gateway_ref
      ON transactions(gateway_reference)
      WHERE gateway_reference IS NOT NULL
    `);

    // Note: Transaction types are added via ALTER TYPE in PostgreSQL
    // This requires checking if values already exist
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'game_buyin' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_type')) THEN
          ALTER TYPE transaction_type ADD VALUE 'game_buyin';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'game_cashout' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_type')) THEN
          ALTER TYPE transaction_type ADD VALUE 'game_cashout';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'game_rebuy' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_type')) THEN
          ALTER TYPE transaction_type ADD VALUE 'game_rebuy';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'admin_credit' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_type')) THEN
          ALTER TYPE transaction_type ADD VALUE 'admin_credit';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'admin_debit' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_type')) THEN
          ALTER TYPE transaction_type ADD VALUE 'admin_debit';
        END IF;
      END$$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_transaction_gateway_ref
    `);

    // Drop columns
    await queryRunner.query(`
      ALTER TABLE transactions
      DROP COLUMN IF EXISTS gateway_reference,
      DROP COLUMN IF EXISTS gateway_status
    `);

    // Note: Removing enum values in PostgreSQL is complex and risky
    // Requires recreating the enum type, which would affect all dependent tables
    // Best practice: Leave enum values in place (they won't cause harm)
    // If removal is absolutely necessary, must:
    // 1. Create new enum without values
    // 2. Convert column to new enum
    // 3. Drop old enum
    // This is omitted for safety
  }
}
