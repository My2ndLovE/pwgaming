import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRefreshTokens1737300000002 implements MigrationInterface {
  name = 'AddRefreshTokens1737300000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create refresh_tokens table
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "token" varchar(500) NOT NULL UNIQUE,
        "userId" uuid NOT NULL,
        "expiresAt" timestamp NOT NULL,
        "isRevoked" boolean NOT NULL DEFAULT false,
        "userAgent" varchar(255),
        "ipAddress" varchar(45),
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "lastUsedAt" timestamp,
        CONSTRAINT "fk_refresh_token_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);

    // Create indexes for performance
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_refresh_token_token" ON "refresh_tokens"("token");
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_refresh_token_user" ON "refresh_tokens"("userId");
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_refresh_token_expires" ON "refresh_tokens"("expiresAt");
    `);

    // Create index for cleanup queries (expired and revoked tokens)
    await queryRunner.query(`
      CREATE INDEX "idx_refresh_token_cleanup"
      ON "refresh_tokens"("expiresAt", "isRevoked")
      WHERE "isRevoked" = false;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_refresh_token_cleanup"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_refresh_token_expires"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_refresh_token_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_refresh_token_token"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens"`);
  }
}
