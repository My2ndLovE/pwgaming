import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedPlatformSettings1737300000001 implements MigrationInterface {
  name = 'SeedPlatformSettings1737300000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if settings already exist
    const existingSettings = await queryRunner.query(
      `SELECT id FROM "platform_settings" LIMIT 1`
    );

    if (existingSettings.length === 0) {
      // Insert default platform settings
      await queryRunner.query(`
        INSERT INTO "platform_settings" (
          "id",
          "defaultSmallBlind",
          "defaultBigBlind",
          "maxRoomSize",
          "actionTimerSeconds",
          "disconnectTimeoutSeconds",
          "minDepositAmount",
          "maxDepositAmount",
          "minWithdrawalAmount",
          "maxWithdrawalAmount",
          "withdrawalFeePercent",
          "maintenanceMode",
          "maintenanceMessage",
          "announcementBanner",
          "rateLimitPerMinute",
          "allowNewRegistrations",
          "allowRoomCreation",
          "updatedAt"
        ) VALUES (
          gen_random_uuid(),
          0.50,
          1.00,
          9,
          30,
          60,
          10.00,
          10000.00,
          10.00,
          5000.00,
          0.00,
          false,
          NULL,
          NULL,
          100,
          true,
          true,
          now()
        );
      `);
    } else {
      // Update existing settings to ensure defaults are set
      await queryRunner.query(`
        UPDATE "platform_settings"
        SET
          "defaultSmallBlind" = COALESCE("defaultSmallBlind", 0.50),
          "defaultBigBlind" = COALESCE("defaultBigBlind", 1.00),
          "maxRoomSize" = COALESCE("maxRoomSize", 9),
          "actionTimerSeconds" = COALESCE("actionTimerSeconds", 30),
          "disconnectTimeoutSeconds" = COALESCE("disconnectTimeoutSeconds", 60),
          "minDepositAmount" = COALESCE("minDepositAmount", 10.00),
          "maxDepositAmount" = COALESCE("maxDepositAmount", 10000.00),
          "minWithdrawalAmount" = COALESCE("minWithdrawalAmount", 10.00),
          "maxWithdrawalAmount" = COALESCE("maxWithdrawalAmount", 5000.00),
          "withdrawalFeePercent" = COALESCE("withdrawalFeePercent", 0.00),
          "maintenanceMode" = COALESCE("maintenanceMode", false),
          "rateLimitPerMinute" = COALESCE("rateLimitPerMinute", 100),
          "allowNewRegistrations" = COALESCE("allowNewRegistrations", true),
          "allowRoomCreation" = COALESCE("allowRoomCreation", true),
          "updatedAt" = now()
        WHERE "id" IN (SELECT "id" FROM "platform_settings" LIMIT 1);
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Do not delete platform settings on rollback
    // This is intentional to preserve configuration
    await queryRunner.query(`
      -- Rollback: Platform settings are preserved
      -- To reset to defaults, manually update the settings
    `);
  }
}
