query: ALTER TABLE "transactions" ALTER COLUMN "status" DROP DEFAULT
query: ALTER TABLE "transactions" ALTER COLUMN "status" TYPE "public"."transactions_status_enum" USING "status"::"text"::"public"."transactions_status_enum"
query: ALTER TABLE "transactions" ALTER COLUMN "status" SET DEFAULT 'pending'
query: DROP TYPE "public"."transaction_status_enum_old"
query: DROP INDEX "public"."idx_audit_log_entity"
query: ALTER TYPE "public"."event_type_enum" RENAME TO "event_type_enum_old"
query: CREATE TYPE "public"."audit_logs_eventtype_enum" AS ENUM('user_suspended', 'user_banned', 'user_reactivated', 'withdrawal_approved', 'withdrawal_rejected', 'deposit_approved', 'deposit_rejected', 'room_suspended', 'room_closed', 'settings_updated', 'admin_login', 'balance_adjustment')
query: ALTER TABLE "audit_logs" ALTER COLUMN "eventType" TYPE "public"."audit_logs_eventtype_enum" USING "eventType"::"text"::"public"."audit_logs_eventtype_enum"
query: DROP TYPE "public"."event_type_enum_old"
query: ALTER TYPE "public"."entity_type_enum" RENAME TO "entity_type_enum_old"
query: CREATE TYPE "public"."audit_logs_entitytype_enum" AS ENUM('user', 'room', 'transaction', 'game', 'settings')
query: ALTER TABLE "audit_logs" ALTER COLUMN "entityType" TYPE "public"."audit_logs_entitytype_enum" USING "entityType"::"text"::"public"."audit_logs_entitytype_enum"
query: DROP TYPE "public"."entity_type_enum_old"
query: DROP INDEX "public"."idx_room_status_created"
query: ALTER TYPE "public"."room_status_enum" RENAME TO "room_status_enum_old"
query: CREATE TYPE "public"."rooms_status_enum" AS ENUM('waiting', 'active', 'completed', 'suspended')
query: ALTER TABLE "rooms" ALTER COLUMN "status" DROP DEFAULT
query: ALTER TABLE "rooms" ALTER COLUMN "status" TYPE "public"."rooms_status_enum" USING "status"::"text"::"public"."rooms_status_enum"
query: ALTER TABLE "rooms" ALTER COLUMN "status" SET DEFAULT 'waiting'
query: DROP TYPE "public"."room_status_enum_old"
query: ALTER TYPE "public"."hand_phase_enum" RENAME TO "hand_phase_enum_old"
query: CREATE TYPE "public"."game_hands_currentphase_enum" AS ENUM('preflop', 'flop', 'turn', 'river', 'showdown', 'completed')
query: ALTER TABLE "game_hands" ALTER COLUMN "currentPhase" DROP DEFAULT
query: ALTER TABLE "game_hands" ALTER COLUMN "currentPhase" TYPE "public"."game_hands_currentphase_enum" USING "currentPhase"::"text"::"public"."game_hands_currentphase_enum"
query: ALTER TABLE "game_hands" ALTER COLUMN "currentPhase" SET DEFAULT 'preflop'
query: DROP TYPE "public"."hand_phase_enum_old"
query failed: DROP TYPE "public"."hand_phase_enum_old"
error: error: cannot drop type hand_phase_enum_old because other objects depend on it
query: ROLLBACK
[Nest] 4392  - 11/15/2025, 12:47:24 AM   ERROR [TypeOrmModule] Unable to connect to the database. Retrying (4)...
QueryFailedError: cannot drop type hand_phase_enum_old because other objects depend on it
    at PostgresQueryRunner.query (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\driver\src\driver\postgres\PostgresQueryRunner.ts:325:19)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async PostgresQueryRunner.executeQueries (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\query-runner\src\query-runner\BaseQueryRunner.ts:681:13)
    at async PostgresQueryRunner.changeColumn (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\driver\src\driver\postgres\PostgresQueryRunner.ts:2307:9)
    at async PostgresQueryRunner.changeColumns (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\driver\src\driver\postgres\PostgresQueryRunner.ts:2319:13)
    at async RdbmsSchemaBuilder.updateExistColumns (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\schema-builder\src\schema-builder\RdbmsSchemaBuilder.ts:969:13)
    at async RdbmsSchemaBuilder.executeSchemaSyncOperationsInProperOrder (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\schema-builder\src\schema-builder\RdbmsSchemaBuilder.ts:229:9)
    at async RdbmsSchemaBuilder.build (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\schema-builder\src\schema-builder\RdbmsSchemaBuilder.ts:95:13)  
    at async DataSource.synchronize (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\data-source\src\data-source\DataSource.ts:340:9)
    at async DataSource.initialize (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\data-source\src\data-source\DataSource.ts:278:43)
query: SELECT version()
query: SELECT * FROM current_schema()
query: CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
query: START TRANSACTION
query: SELECT * FROM current_schema()
query: SELECT * FROM current_database()
query: SELECT "table_schema", "table_name", obj_description(('"' || "table_schema" || '"."' || "table_name" || '"')::regclass, 'pg_class') AS table_comment FROM "information_schema"."tables" WHERE ("table_schema" = 'public' AND "table_name" = 'users') OR ("table_schema" = 'public' AND "table_name" = 'transactions') OR ("table_schema" = 'public' AND "table_name" = 'audit_logs') OR ("table_schema" = 'public' AND "table_name" = 'rooms') OR ("table_schema" = 
'public' AND "table_name" = 'game_hands') OR ("table_schema" = 'public' AND "table_name" = 'player_seats') OR ("table_schema" = 'public' AND "table_name" = 'betting_actions') OR ("table_schema" = 'public' AND "table_name" = 'platform_settings')
query: SELECT TRUE FROM information_schema.columns WHERE table_name = 'pg_class' and column_name = 'relispartition'
query: SELECT columns.*, pg_catalog.col_description(('"' || table_catalog || '"."' || table_schema || '"."' || table_name || '"')::regclass::oid, ordinal_position) AS description, ('"' || "udt_schema" || '"."' || "udt_name" || '"')::"regtype"::text AS "regtype", pg_catalog.format_type("col_attr"."atttypid", "col_attr"."atttypmod") AS "format_type" FROM "information_schema"."columns" LEFT JOIN "pg_catalog"."pg_attribute" AS "col_attr" ON "col_attr"."attname" = "columns"."column_name" AND "col_attr"."attrelid" = ( SELECT "cls"."oid" FROM "pg_catalog"."pg_class" AS "cls" LEFT JOIN "pg_catalog"."pg_namespace" AS "ns" ON "ns"."oid" = "cls"."relnamespace" WHERE "cls"."relname" = "columns"."table_name" AND "ns"."nspname" = "columns"."table_schema" ) WHERE ("table_schema" = 'public' AND "table_name" = 'users') OR ("table_schema" = 'public' AND "table_name" = 'rooms') OR ("table_schema" = 'public' AND "table_name" = 'transactions') OR ("table_schema" = 'public' AND "table_name" = 'game_hands') OR ("table_schema" = 'public' AND "table_name" = 'player_seats') OR ("table_schema" = 'public' AND "table_name" = 'betting_actions') OR ("table_schema" = 'public' AND "table_name" = 'audit_logs') OR ("table_schema" = 'public' AND "table_name" = 'platform_settings')
query: SELECT "ns"."nspname" AS "table_schema", "t"."relname" AS "table_name", "cnst"."conname" AS "constraint_name", pg_get_constraintdef("cnst"."oid") 
AS "expression", CASE "cnst"."contype" WHEN 'p' THEN 'PRIMARY' WHEN 'u' THEN 'UNIQUE' WHEN 'c' THEN 'CHECK' WHEN 'x' THEN 'EXCLUDE' END AS "constraint_type", "a"."attname" AS "column_name" FROM "pg_constraint" "cnst" INNER JOIN "pg_class" "t" ON "t"."oid" = "cnst"."conrelid" INNER JOIN "pg_namespace" "ns" ON "ns"."oid" = "cnst"."connamespace" LEFT JOIN "pg_attribute" "a" ON "a"."attrelid" = "cnst"."conrelid" AND "a"."attnum" = ANY ("cnst"."conkey") WHERE 
"t"."relkind" IN ('r', 'p') AND (("ns"."nspname" = 'public' AND "t"."relname" = 'users') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'rooms') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'transactions') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'game_hands') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'player_seats') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'betting_actions') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'audit_logs') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'platform_settings'))
query: SELECT "ns"."nspname" AS "table_schema", "t"."relname" AS "table_name", "i"."relname" AS "constraint_name", "a"."attname" AS "column_name", CASE "ix"."indisunique" WHEN 't' THEN 'TRUE' ELSE'FALSE' END AS "is_unique", pg_get_expr("ix"."indpred", "ix"."indrelid") AS "condition", "types"."typname" AS 
"type_name", "am"."amname" AS "index_type" FROM "pg_class" "t" INNER JOIN "pg_index" "ix" ON "ix"."indrelid" = "t"."oid" INNER JOIN "pg_attribute" "a" ON "a"."attrelid" = "t"."oid"  AND "a"."attnum" = ANY ("ix"."indkey") INNER JOIN "pg_namespace" "ns" ON "ns"."oid" = "t"."relnamespace" INNER JOIN "pg_class" "i" ON "i"."oid" = "ix"."indexrelid" INNER JOIN "pg_type" "types" ON "types"."oid" = "a"."atttypid" INNER JOIN "pg_am" "am" ON "i"."relam" = "am"."oid" LEFT JOIN "pg_constraint" "cnst" ON "cnst"."conname" = "i"."relname" WHERE "t"."relkind" IN ('r', 'p') AND "cnst"."contype" IS NULL AND (("ns"."nspname" = 'public' AND "t"."relname" = 'users') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'rooms') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'transactions') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'game_hands') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'player_seats') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'betting_actions') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'audit_logs') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'platform_settings'))
query: SELECT "con"."conname" AS "constraint_name", "con"."nspname" AS "table_schema", "con"."relname" AS "table_name", "att2"."attname" AS "column_name", "ns"."nspname" AS "referenced_table_schema", "cl"."relname" AS "referenced_table_name", "att"."attname" AS "referenced_column_name", "con"."confdeltype" AS "on_delete", "con"."confupdtype" AS "on_update", "con"."condeferrable" AS "deferrable", "con"."condeferred" AS "deferred" FROM ( SELECT UNNEST ("con1"."conkey") AS "parent", UNNEST ("con1"."confkey") AS "child", "con1"."confrelid", "con1"."conrelid", "con1"."conname", "con1"."contype", "ns"."nspname", "cl"."relname", "con1"."condeferrable", CASE WHEN "con1"."condeferred" THEN 'INITIALLY DEFERRED' ELSE 'INITIALLY IMMEDIATE' END as condeferred, CASE "con1"."confdeltype" WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT' WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END as "confdeltype", CASE "con1"."confupdtype" WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT' WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END as "confupdtype" FROM "pg_class" "cl" INNER JOIN "pg_namespace" "ns" ON "cl"."relnamespace" = "ns"."oid" INNER JOIN "pg_constraint" 
"con1" ON "con1"."conrelid" = "cl"."oid" WHERE "con1"."contype" = 'f' AND (("ns"."nspname" = 'public' AND "cl"."relname" = 'users') OR ("ns"."nspname" = 
'public' AND "cl"."relname" = 'rooms') OR ("ns"."nspname" = 'public' AND "cl"."relname" = 'transactions') OR ("ns"."nspname" = 'public' AND "cl"."relname" = 'game_hands') OR ("ns"."nspname" = 'public' AND "cl"."relname" = 'player_seats') OR ("ns"."nspname" = 'public' AND "cl"."relname" = 'betting_actions') OR ("ns"."nspname" = 'public' AND "cl"."relname" = 'audit_logs') OR ("ns"."nspname" = 'public' AND "cl"."relname" = 'platform_settings')) ) "con" INNER JOIN "pg_attribute" "att" ON "att"."attrelid" = "con"."confrelid" AND "att"."attnum" = "con"."child" INNER JOIN "pg_class" "cl" ON "cl"."oid" = "con"."confrelid"  AND "cl"."relispartition" = 'f'INNER JOIN "pg_namespace" "ns" ON "cl"."relnamespace" = "ns"."oid" INNER JOIN "pg_attribute" "att2" ON "att2"."attrelid" = "con"."conrelid" AND "att2"."attnum" = "con"."parent"
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'users' AND "column_name"='role'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'users' AND "column_name"='status'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'rooms' AND "column_name"='status'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'transactions' AND "column_name"='type'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'transactions' AND "column_name"='status'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'game_hands' AND "column_name"='currentPhase'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'player_seats' AND "column_name"='status'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'betting_actions' AND "column_name"='action'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'betting_actions' AND "column_name"='phase'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'audit_logs' AND "column_name"='eventType'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'audit_logs' AND "column_name"='entityType'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'user_role_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'user_status_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'room_status_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'transaction_type_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'transaction_status_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'hand_phase_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'seat_status_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'action_type_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'hand_phase_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'event_type_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'entity_type_enum'
query: SELECT * FROM "information_schema"."tables" WHERE "table_schema" = 'public' AND "table_name" = 'typeorm_metadata'
query: ALTER TABLE "transactions" DROP CONSTRAINT "fk_transaction_user"
query: ALTER TABLE "transactions" DROP CONSTRAINT "fk_transaction_processor"
query: ALTER TABLE "audit_logs" DROP CONSTRAINT "fk_audit_log_user"
query: ALTER TABLE "rooms" DROP CONSTRAINT "fk_room_creator"
query: ALTER TABLE "game_hands" DROP CONSTRAINT "fk_game_hand_room"
query: ALTER TABLE "player_seats" DROP CONSTRAINT "fk_player_seat_game_hand"
query: ALTER TABLE "player_seats" DROP CONSTRAINT "fk_player_seat_user"
query: ALTER TABLE "betting_actions" DROP CONSTRAINT "fk_betting_action_game_hand"
query: ALTER TABLE "betting_actions" DROP CONSTRAINT "fk_betting_action_player"
query: DROP INDEX "public"."idx_user_telegram_id"
query: DROP INDEX "public"."idx_game_hand_players"
query: ALTER TYPE "public"."user_role_enum" RENAME TO "user_role_enum_old"
query: CREATE TYPE "public"."users_role_enum" AS ENUM('player', 'admin')
query: ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT
query: ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"text"::"public"."users_role_enum"
query: ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'player'
query: DROP TYPE "public"."user_role_enum_old"
query: ALTER TYPE "public"."user_status_enum" RENAME TO "user_status_enum_old"
query: CREATE TYPE "public"."users_status_enum" AS ENUM('active', 'suspended', 'banned')
query: ALTER TABLE "users" ALTER COLUMN "status" DROP DEFAULT
query: ALTER TABLE "users" ALTER COLUMN "status" TYPE "public"."users_status_enum" USING "status"::"text"::"public"."users_status_enum"
query: ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'active'
query: DROP TYPE "public"."user_status_enum_old"
query: DROP INDEX "public"."idx_transaction_type_status"
query: ALTER TYPE "public"."transaction_type_enum" RENAME TO "transaction_type_enum_old"
query: CREATE TYPE "public"."transactions_type_enum" AS ENUM('deposit', 'withdrawal', 'game_win', 'game_loss', 'admin_adjustment')
query: ALTER TABLE "transactions" ALTER COLUMN "type" TYPE "public"."transactions_type_enum" USING "type"::"text"::"public"."transactions_type_enum"     
query: DROP TYPE "public"."transaction_type_enum_old"
query: ALTER TYPE "public"."transaction_status_enum" RENAME TO "transaction_status_enum_old"
query: CREATE TYPE "public"."transactions_status_enum" AS ENUM('pending', 'processing', 'completed', 'rejected', 'failed')
query: ALTER TABLE "transactions" ALTER COLUMN "status" DROP DEFAULT
query: ALTER TABLE "transactions" ALTER COLUMN "status" TYPE "public"."transactions_status_enum" USING "status"::"text"::"public"."transactions_status_enum"
query: ALTER TABLE "transactions" ALTER COLUMN "status" SET DEFAULT 'pending'
query: DROP TYPE "public"."transaction_status_enum_old"
query: DROP INDEX "public"."idx_audit_log_entity"
query: ALTER TYPE "public"."event_type_enum" RENAME TO "event_type_enum_old"
query: CREATE TYPE "public"."audit_logs_eventtype_enum" AS ENUM('user_suspended', 'user_banned', 'user_reactivated', 'withdrawal_approved', 'withdrawal_rejected', 'deposit_approved', 'deposit_rejected', 'room_suspended', 'room_closed', 'settings_updated', 'admin_login', 'balance_adjustment')
query: ALTER TABLE "audit_logs" ALTER COLUMN "eventType" TYPE "public"."audit_logs_eventtype_enum" USING "eventType"::"text"::"public"."audit_logs_eventtype_enum"
query: DROP TYPE "public"."event_type_enum_old"
query: ALTER TYPE "public"."entity_type_enum" RENAME TO "entity_type_enum_old"
query: CREATE TYPE "public"."audit_logs_entitytype_enum" AS ENUM('user', 'room', 'transaction', 'game', 'settings')
query: ALTER TABLE "audit_logs" ALTER COLUMN "entityType" TYPE "public"."audit_logs_entitytype_enum" USING "entityType"::"text"::"public"."audit_logs_entitytype_enum"
query: DROP TYPE "public"."entity_type_enum_old"
query: DROP INDEX "public"."idx_room_status_created"
query: ALTER TYPE "public"."room_status_enum" RENAME TO "room_status_enum_old"
query: CREATE TYPE "public"."rooms_status_enum" AS ENUM('waiting', 'active', 'completed', 'suspended')
query: ALTER TABLE "rooms" ALTER COLUMN "status" DROP DEFAULT
query: ALTER TABLE "rooms" ALTER COLUMN "status" TYPE "public"."rooms_status_enum" USING "status"::"text"::"public"."rooms_status_enum"
query: ALTER TABLE "rooms" ALTER COLUMN "status" SET DEFAULT 'waiting'
query: DROP TYPE "public"."room_status_enum_old"
query: ALTER TYPE "public"."hand_phase_enum" RENAME TO "hand_phase_enum_old"
query: CREATE TYPE "public"."game_hands_currentphase_enum" AS ENUM('preflop', 'flop', 'turn', 'river', 'showdown', 'completed')
query: ALTER TABLE "game_hands" ALTER COLUMN "currentPhase" DROP DEFAULT
query: ALTER TABLE "game_hands" ALTER COLUMN "currentPhase" TYPE "public"."game_hands_currentphase_enum" USING "currentPhase"::"text"::"public"."game_hands_currentphase_enum"
query: ALTER TABLE "game_hands" ALTER COLUMN "currentPhase" SET DEFAULT 'preflop'
query: DROP TYPE "public"."hand_phase_enum_old"
query failed: DROP TYPE "public"."hand_phase_enum_old"
error: error: cannot drop type hand_phase_enum_old because other objects depend on it
query: ROLLBACK
[Nest] 4392  - 11/15/2025, 12:47:28 AM   ERROR [TypeOrmModule] Unable to connect to the database. Retrying (5)...
QueryFailedError: cannot drop type hand_phase_enum_old because other objects depend on it
    at PostgresQueryRunner.query (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\driver\src\driver\postgres\PostgresQueryRunner.ts:325:19)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async PostgresQueryRunner.executeQueries (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\query-runner\src\query-runner\BaseQueryRunner.ts:681:13)
    at async PostgresQueryRunner.changeColumn (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\driver\src\driver\postgres\PostgresQueryRunner.ts:2307:9)
    at async PostgresQueryRunner.changeColumns (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\driver\src\driver\postgres\PostgresQueryRunner.ts:2319:13)
    at async RdbmsSchemaBuilder.updateExistColumns (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\schema-builder\src\schema-builder\RdbmsSchemaBuilder.ts:969:13)
    at async RdbmsSchemaBuilder.executeSchemaSyncOperationsInProperOrder (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\schema-builder\src\schema-builder\RdbmsSchemaBuilder.ts:229:9)
    at async RdbmsSchemaBuilder.build (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\schema-builder\src\schema-builder\RdbmsSchemaBuilder.ts:95:13)  
    at async DataSource.synchronize (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\data-source\src\data-source\DataSource.ts:340:9)
    at async DataSource.initialize (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\data-source\src\data-source\DataSource.ts:278:43)
query: SELECT version()
query: SELECT * FROM current_schema()
query: CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
query: START TRANSACTION
query: SELECT * FROM current_schema()
query: SELECT * FROM current_database()
query: SELECT "table_schema", "table_name", obj_description(('"' || "table_schema" || '"."' || "table_name" || '"')::regclass, 'pg_class') AS table_comment FROM "information_schema"."tables" WHERE ("table_schema" = 'public' AND "table_name" = 'users') OR ("table_schema" = 'public' AND "table_name" = 'transactions') OR ("table_schema" = 'public' AND "table_name" = 'audit_logs') OR ("table_schema" = 'public' AND "table_name" = 'rooms') OR ("table_schema" = 
'public' AND "table_name" = 'game_hands') OR ("table_schema" = 'public' AND "table_name" = 'player_seats') OR ("table_schema" = 'public' AND "table_name" = 'betting_actions') OR ("table_schema" = 'public' AND "table_name" = 'platform_settings')
query: SELECT TRUE FROM information_schema.columns WHERE table_name = 'pg_class' and column_name = 'relispartition'
query: SELECT columns.*, pg_catalog.col_description(('"' || table_catalog || '"."' || table_schema || '"."' || table_name || '"')::regclass::oid, ordinal_position) AS description, ('"' || "udt_schema" || '"."' || "udt_name" || '"')::"regtype"::text AS "regtype", pg_catalog.format_type("col_attr"."atttypid", "col_attr"."atttypmod") AS "format_type" FROM "information_schema"."columns" LEFT JOIN "pg_catalog"."pg_attribute" AS "col_attr" ON "col_attr"."attname" = "columns"."column_name" AND "col_attr"."attrelid" = ( SELECT "cls"."oid" FROM "pg_catalog"."pg_class" AS "cls" LEFT JOIN "pg_catalog"."pg_namespace" AS "ns" ON "ns"."oid" = "cls"."relnamespace" WHERE "cls"."relname" = "columns"."table_name" AND "ns"."nspname" = "columns"."table_schema" ) WHERE ("table_schema" = 'public' AND "table_name" = 'users') OR ("table_schema" = 'public' AND "table_name" = 'rooms') OR ("table_schema" = 'public' AND "table_name" = 'transactions') OR ("table_schema" = 'public' AND "table_name" = 'game_hands') OR ("table_schema" = 'public' AND "table_name" = 'player_seats') OR ("table_schema" = 'public' AND "table_name" = 'betting_actions') OR ("table_schema" = 'public' AND "table_name" = 'audit_logs') OR ("table_schema" = 'public' AND "table_name" = 'platform_settings')
query: SELECT "ns"."nspname" AS "table_schema", "t"."relname" AS "table_name", "cnst"."conname" AS "constraint_name", pg_get_constraintdef("cnst"."oid") 
AS "expression", CASE "cnst"."contype" WHEN 'p' THEN 'PRIMARY' WHEN 'u' THEN 'UNIQUE' WHEN 'c' THEN 'CHECK' WHEN 'x' THEN 'EXCLUDE' END AS "constraint_type", "a"."attname" AS "column_name" FROM "pg_constraint" "cnst" INNER JOIN "pg_class" "t" ON "t"."oid" = "cnst"."conrelid" INNER JOIN "pg_namespace" "ns" ON "ns"."oid" = "cnst"."connamespace" LEFT JOIN "pg_attribute" "a" ON "a"."attrelid" = "cnst"."conrelid" AND "a"."attnum" = ANY ("cnst"."conkey") WHERE 
"t"."relkind" IN ('r', 'p') AND (("ns"."nspname" = 'public' AND "t"."relname" = 'users') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'rooms') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'transactions') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'game_hands') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'player_seats') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'betting_actions') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'audit_logs') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'platform_settings'))
query: SELECT "ns"."nspname" AS "table_schema", "t"."relname" AS "table_name", "i"."relname" AS "constraint_name", "a"."attname" AS "column_name", CASE "ix"."indisunique" WHEN 't' THEN 'TRUE' ELSE'FALSE' END AS "is_unique", pg_get_expr("ix"."indpred", "ix"."indrelid") AS "condition", "types"."typname" AS 
"type_name", "am"."amname" AS "index_type" FROM "pg_class" "t" INNER JOIN "pg_index" "ix" ON "ix"."indrelid" = "t"."oid" INNER JOIN "pg_attribute" "a" ON "a"."attrelid" = "t"."oid"  AND "a"."attnum" = ANY ("ix"."indkey") INNER JOIN "pg_namespace" "ns" ON "ns"."oid" = "t"."relnamespace" INNER JOIN "pg_class" "i" ON "i"."oid" = "ix"."indexrelid" INNER JOIN "pg_type" "types" ON "types"."oid" = "a"."atttypid" INNER JOIN "pg_am" "am" ON "i"."relam" = "am"."oid" LEFT JOIN "pg_constraint" "cnst" ON "cnst"."conname" = "i"."relname" WHERE "t"."relkind" IN ('r', 'p') AND "cnst"."contype" IS NULL AND (("ns"."nspname" = 'public' AND "t"."relname" = 'users') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'rooms') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'transactions') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'game_hands') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'player_seats') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'betting_actions') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'audit_logs') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'platform_settings'))
query: SELECT "con"."conname" AS "constraint_name", "con"."nspname" AS "table_schema", "con"."relname" AS "table_name", "att2"."attname" AS "column_name", "ns"."nspname" AS "referenced_table_schema", "cl"."relname" AS "referenced_table_name", "att"."attname" AS "referenced_column_name", "con"."confdeltype" AS "on_delete", "con"."confupdtype" AS "on_update", "con"."condeferrable" AS "deferrable", "con"."condeferred" AS "deferred" FROM ( SELECT UNNEST ("con1"."conkey") AS "parent", UNNEST ("con1"."confkey") AS "child", "con1"."confrelid", "con1"."conrelid", "con1"."conname", "con1"."contype", "ns"."nspname", "cl"."relname", "con1"."condeferrable", CASE WHEN "con1"."condeferred" THEN 'INITIALLY DEFERRED' ELSE 'INITIALLY IMMEDIATE' END as condeferred, CASE "con1"."confdeltype" WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT' WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END as "confdeltype", CASE "con1"."confupdtype" WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT' WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END as "confupdtype" FROM "pg_class" "cl" INNER JOIN "pg_namespace" "ns" ON "cl"."relnamespace" = "ns"."oid" INNER JOIN "pg_constraint" 
"con1" ON "con1"."conrelid" = "cl"."oid" WHERE "con1"."contype" = 'f' AND (("ns"."nspname" = 'public' AND "cl"."relname" = 'users') OR ("ns"."nspname" = 
'public' AND "cl"."relname" = 'rooms') OR ("ns"."nspname" = 'public' AND "cl"."relname" = 'transactions') OR ("ns"."nspname" = 'public' AND "cl"."relname" = 'game_hands') OR ("ns"."nspname" = 'public' AND "cl"."relname" = 'player_seats') OR ("ns"."nspname" = 'public' AND "cl"."relname" = 'betting_actions') OR ("ns"."nspname" = 'public' AND "cl"."relname" = 'audit_logs') OR ("ns"."nspname" = 'public' AND "cl"."relname" = 'platform_settings')) ) "con" INNER JOIN "pg_attribute" "att" ON "att"."attrelid" = "con"."confrelid" AND "att"."attnum" = "con"."child" INNER JOIN "pg_class" "cl" ON "cl"."oid" = "con"."confrelid"  AND "cl"."relispartition" = 'f'INNER JOIN "pg_namespace" "ns" ON "cl"."relnamespace" = "ns"."oid" INNER JOIN "pg_attribute" "att2" ON "att2"."attrelid" = "con"."conrelid" AND "att2"."attnum" = "con"."parent"
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'users' AND "column_name"='role'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'users' AND "column_name"='status'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'rooms' AND "column_name"='status'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'transactions' AND "column_name"='type'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'transactions' AND "column_name"='status'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'game_hands' AND "column_name"='currentPhase'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'player_seats' AND "column_name"='status'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'betting_actions' AND "column_name"='action'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'betting_actions' AND "column_name"='phase'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'audit_logs' AND "column_name"='eventType'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'audit_logs' AND "column_name"='entityType'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'user_role_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'user_status_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'room_status_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'transaction_type_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'transaction_status_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'hand_phase_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'seat_status_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'action_type_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'hand_phase_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'event_type_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'entity_type_enum'
query: SELECT * FROM "information_schema"."tables" WHERE "table_schema" = 'public' AND "table_name" = 'typeorm_metadata'
query: ALTER TABLE "transactions" DROP CONSTRAINT "fk_transaction_user"
query: ALTER TABLE "transactions" DROP CONSTRAINT "fk_transaction_processor"
query: ALTER TABLE "audit_logs" DROP CONSTRAINT "fk_audit_log_user"
query: ALTER TABLE "rooms" DROP CONSTRAINT "fk_room_creator"
query: ALTER TABLE "game_hands" DROP CONSTRAINT "fk_game_hand_room"
query: ALTER TABLE "player_seats" DROP CONSTRAINT "fk_player_seat_game_hand"
query: ALTER TABLE "player_seats" DROP CONSTRAINT "fk_player_seat_user"
query: ALTER TABLE "betting_actions" DROP CONSTRAINT "fk_betting_action_game_hand"
query: ALTER TABLE "betting_actions" DROP CONSTRAINT "fk_betting_action_player"
query: DROP INDEX "public"."idx_user_telegram_id"
query: DROP INDEX "public"."idx_game_hand_players"
query: ALTER TYPE "public"."user_role_enum" RENAME TO "user_role_enum_old"
query: CREATE TYPE "public"."users_role_enum" AS ENUM('player', 'admin')
query: ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT
query: ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"text"::"public"."users_role_enum"
query: ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'player'
query: DROP TYPE "public"."user_role_enum_old"
query: ALTER TYPE "public"."user_status_enum" RENAME TO "user_status_enum_old"
query: CREATE TYPE "public"."users_status_enum" AS ENUM('active', 'suspended', 'banned')
query: ALTER TABLE "users" ALTER COLUMN "status" DROP DEFAULT
query: ALTER TABLE "users" ALTER COLUMN "status" TYPE "public"."users_status_enum" USING "status"::"text"::"public"."users_status_enum"
query: ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'active'
query: DROP TYPE "public"."user_status_enum_old"
query: DROP INDEX "public"."idx_transaction_type_status"
query: ALTER TYPE "public"."transaction_type_enum" RENAME TO "transaction_type_enum_old"
query: CREATE TYPE "public"."transactions_type_enum" AS ENUM('deposit', 'withdrawal', 'game_win', 'game_loss', 'admin_adjustment')
query: ALTER TABLE "transactions" ALTER COLUMN "type" TYPE "public"."transactions_type_enum" USING "type"::"text"::"public"."transactions_type_enum"     
query: DROP TYPE "public"."transaction_type_enum_old"
query: ALTER TYPE "public"."transaction_status_enum" RENAME TO "transaction_status_enum_old"
query: CREATE TYPE "public"."transactions_status_enum" AS ENUM('pending', 'processing', 'completed', 'rejected', 'failed')
query: ALTER TABLE "transactions" ALTER COLUMN "status" DROP DEFAULT
query: ALTER TABLE "transactions" ALTER COLUMN "status" TYPE "public"."transactions_status_enum" USING "status"::"text"::"public"."transactions_status_enum"
query: ALTER TABLE "transactions" ALTER COLUMN "status" SET DEFAULT 'pending'
query: DROP TYPE "public"."transaction_status_enum_old"
query: DROP INDEX "public"."idx_audit_log_entity"
query: ALTER TYPE "public"."event_type_enum" RENAME TO "event_type_enum_old"
query: CREATE TYPE "public"."audit_logs_eventtype_enum" AS ENUM('user_suspended', 'user_banned', 'user_reactivated', 'withdrawal_approved', 'withdrawal_rejected', 'deposit_approved', 'deposit_rejected', 'room_suspended', 'room_closed', 'settings_updated', 'admin_login', 'balance_adjustment')
query: ALTER TABLE "audit_logs" ALTER COLUMN "eventType" TYPE "public"."audit_logs_eventtype_enum" USING "eventType"::"text"::"public"."audit_logs_eventtype_enum"
query: DROP TYPE "public"."event_type_enum_old"
query: ALTER TYPE "public"."entity_type_enum" RENAME TO "entity_type_enum_old"
query: CREATE TYPE "public"."audit_logs_entitytype_enum" AS ENUM('user', 'room', 'transaction', 'game', 'settings')
query: ALTER TABLE "audit_logs" ALTER COLUMN "entityType" TYPE "public"."audit_logs_entitytype_enum" USING "entityType"::"text"::"public"."audit_logs_entitytype_enum"
query: DROP TYPE "public"."entity_type_enum_old"
query: DROP INDEX "public"."idx_room_status_created"
query: ALTER TYPE "public"."room_status_enum" RENAME TO "room_status_enum_old"
query: CREATE TYPE "public"."rooms_status_enum" AS ENUM('waiting', 'active', 'completed', 'suspended')
query: ALTER TABLE "rooms" ALTER COLUMN "status" DROP DEFAULT
query: ALTER TABLE "rooms" ALTER COLUMN "status" TYPE "public"."rooms_status_enum" USING "status"::"text"::"public"."rooms_status_enum"
query: ALTER TABLE "rooms" ALTER COLUMN "status" SET DEFAULT 'waiting'
query: DROP TYPE "public"."room_status_enum_old"
query: ALTER TYPE "public"."hand_phase_enum" RENAME TO "hand_phase_enum_old"
query: CREATE TYPE "public"."game_hands_currentphase_enum" AS ENUM('preflop', 'flop', 'turn', 'river', 'showdown', 'completed')
query: ALTER TABLE "game_hands" ALTER COLUMN "currentPhase" DROP DEFAULT
query: ALTER TABLE "game_hands" ALTER COLUMN "currentPhase" TYPE "public"."game_hands_currentphase_enum" USING "currentPhase"::"text"::"public"."game_hands_currentphase_enum"
query: ALTER TABLE "game_hands" ALTER COLUMN "currentPhase" SET DEFAULT 'preflop'
query: DROP TYPE "public"."hand_phase_enum_old"
query failed: DROP TYPE "public"."hand_phase_enum_old"
error: error: cannot drop type hand_phase_enum_old because other objects depend on it
query: ROLLBACK
[Nest] 4392  - 11/15/2025, 12:47:31 AM   ERROR [TypeOrmModule] Unable to connect to the database. Retrying (6)...
QueryFailedError: cannot drop type hand_phase_enum_old because other objects depend on it
    at PostgresQueryRunner.query (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\driver\src\driver\postgres\PostgresQueryRunner.ts:325:19)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async PostgresQueryRunner.executeQueries (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\query-runner\src\query-runner\BaseQueryRunner.ts:681:13)
    at async PostgresQueryRunner.changeColumn (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\driver\src\driver\postgres\PostgresQueryRunner.ts:2307:9)
    at async PostgresQueryRunner.changeColumns (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\driver\src\driver\postgres\PostgresQueryRunner.ts:2319:13)
    at async RdbmsSchemaBuilder.updateExistColumns (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\schema-builder\src\schema-builder\RdbmsSchemaBuilder.ts:969:13)
    at async RdbmsSchemaBuilder.executeSchemaSyncOperationsInProperOrder (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\schema-builder\src\schema-builder\RdbmsSchemaBuilder.ts:229:9)
    at async RdbmsSchemaBuilder.build (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\schema-builder\src\schema-builder\RdbmsSchemaBuilder.ts:95:13)  
    at async DataSource.synchronize (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\data-source\src\data-source\DataSource.ts:340:9)
    at async DataSource.initialize (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\data-source\src\data-source\DataSource.ts:278:43)
query: SELECT version()
query: SELECT * FROM current_schema()
query: CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
query: START TRANSACTION
query: SELECT * FROM current_schema()
query: SELECT * FROM current_database()
query: SELECT "table_schema", "table_name", obj_description(('"' || "table_schema" || '"."' || "table_name" || '"')::regclass, 'pg_class') AS table_comment FROM "information_schema"."tables" WHERE ("table_schema" = 'public' AND "table_name" = 'users') OR ("table_schema" = 'public' AND "table_name" = 'transactions') OR ("table_schema" = 'public' AND "table_name" = 'audit_logs') OR ("table_schema" = 'public' AND "table_name" = 'rooms') OR ("table_schema" = 
'public' AND "table_name" = 'game_hands') OR ("table_schema" = 'public' AND "table_name" = 'player_seats') OR ("table_schema" = 'public' AND "table_name" = 'betting_actions') OR ("table_schema" = 'public' AND "table_name" = 'platform_settings')
query: SELECT TRUE FROM information_schema.columns WHERE table_name = 'pg_class' and column_name = 'relispartition'
query: SELECT columns.*, pg_catalog.col_description(('"' || table_catalog || '"."' || table_schema || '"."' || table_name || '"')::regclass::oid, ordinal_position) AS description, ('"' || "udt_schema" || '"."' || "udt_name" || '"')::"regtype"::text AS "regtype", pg_catalog.format_type("col_attr"."atttypid", "col_attr"."atttypmod") AS "format_type" FROM "information_schema"."columns" LEFT JOIN "pg_catalog"."pg_attribute" AS "col_attr" ON "col_attr"."attname" = "columns"."column_name" AND "col_attr"."attrelid" = ( SELECT "cls"."oid" FROM "pg_catalog"."pg_class" AS "cls" LEFT JOIN "pg_catalog"."pg_namespace" AS "ns" ON "ns"."oid" = "cls"."relnamespace" WHERE "cls"."relname" = "columns"."table_name" AND "ns"."nspname" = "columns"."table_schema" ) WHERE ("table_schema" = 'public' AND "table_name" = 'users') OR ("table_schema" = 'public' AND "table_name" = 'rooms') OR ("table_schema" = 'public' AND "table_name" = 'transactions') OR ("table_schema" = 'public' AND "table_name" = 'game_hands') OR ("table_schema" = 'public' AND "table_name" = 'player_seats') OR ("table_schema" = 'public' AND "table_name" = 'betting_actions') OR ("table_schema" = 'public' AND "table_name" = 'audit_logs') OR ("table_schema" = 'public' AND "table_name" = 'platform_settings')
query: SELECT "ns"."nspname" AS "table_schema", "t"."relname" AS "table_name", "cnst"."conname" AS "constraint_name", pg_get_constraintdef("cnst"."oid") 
AS "expression", CASE "cnst"."contype" WHEN 'p' THEN 'PRIMARY' WHEN 'u' THEN 'UNIQUE' WHEN 'c' THEN 'CHECK' WHEN 'x' THEN 'EXCLUDE' END AS "constraint_type", "a"."attname" AS "column_name" FROM "pg_constraint" "cnst" INNER JOIN "pg_class" "t" ON "t"."oid" = "cnst"."conrelid" INNER JOIN "pg_namespace" "ns" ON "ns"."oid" = "cnst"."connamespace" LEFT JOIN "pg_attribute" "a" ON "a"."attrelid" = "cnst"."conrelid" AND "a"."attnum" = ANY ("cnst"."conkey") WHERE 
"t"."relkind" IN ('r', 'p') AND (("ns"."nspname" = 'public' AND "t"."relname" = 'users') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'rooms') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'transactions') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'game_hands') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'player_seats') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'betting_actions') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'audit_logs') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'platform_settings'))
query: SELECT "ns"."nspname" AS "table_schema", "t"."relname" AS "table_name", "i"."relname" AS "constraint_name", "a"."attname" AS "column_name", CASE "ix"."indisunique" WHEN 't' THEN 'TRUE' ELSE'FALSE' END AS "is_unique", pg_get_expr("ix"."indpred", "ix"."indrelid") AS "condition", "types"."typname" AS 
"type_name", "am"."amname" AS "index_type" FROM "pg_class" "t" INNER JOIN "pg_index" "ix" ON "ix"."indrelid" = "t"."oid" INNER JOIN "pg_attribute" "a" ON "a"."attrelid" = "t"."oid"  AND "a"."attnum" = ANY ("ix"."indkey") INNER JOIN "pg_namespace" "ns" ON "ns"."oid" = "t"."relnamespace" INNER JOIN "pg_class" "i" ON "i"."oid" = "ix"."indexrelid" INNER JOIN "pg_type" "types" ON "types"."oid" = "a"."atttypid" INNER JOIN "pg_am" "am" ON "i"."relam" = "am"."oid" LEFT JOIN "pg_constraint" "cnst" ON "cnst"."conname" = "i"."relname" WHERE "t"."relkind" IN ('r', 'p') AND "cnst"."contype" IS NULL AND (("ns"."nspname" = 'public' AND "t"."relname" = 'users') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'rooms') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'transactions') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'game_hands') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'player_seats') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'betting_actions') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'audit_logs') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'platform_settings'))
query: SELECT "con"."conname" AS "constraint_name", "con"."nspname" AS "table_schema", "con"."relname" AS "table_name", "att2"."attname" AS "column_name", "ns"."nspname" AS "referenced_table_schema", "cl"."relname" AS "referenced_table_name", "att"."attname" AS "referenced_column_name", "con"."confdeltype" AS "on_delete", "con"."confupdtype" AS "on_update", "con"."condeferrable" AS "deferrable", "con"."condeferred" AS "deferred" FROM ( SELECT UNNEST ("con1"."conkey") AS "parent", UNNEST ("con1"."confkey") AS "child", "con1"."confrelid", "con1"."conrelid", "con1"."conname", "con1"."contype", "ns"."nspname", "cl"."relname", "con1"."condeferrable", CASE WHEN "con1"."condeferred" THEN 'INITIALLY DEFERRED' ELSE 'INITIALLY IMMEDIATE' END as condeferred, CASE "con1"."confdeltype" WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT' WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END as "confdeltype", CASE "con1"."confupdtype" WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT' WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END as "confupdtype" FROM "pg_class" "cl" INNER JOIN "pg_namespace" "ns" ON "cl"."relnamespace" = "ns"."oid" INNER JOIN "pg_constraint" 
"con1" ON "con1"."conrelid" = "cl"."oid" WHERE "con1"."contype" = 'f' AND (("ns"."nspname" = 'public' AND "cl"."relname" = 'users') OR ("ns"."nspname" = 
'public' AND "cl"."relname" = 'rooms') OR ("ns"."nspname" = 'public' AND "cl"."relname" = 'transactions') OR ("ns"."nspname" = 'public' AND "cl"."relname" = 'game_hands') OR ("ns"."nspname" = 'public' AND "cl"."relname" = 'player_seats') OR ("ns"."nspname" = 'public' AND "cl"."relname" = 'betting_actions') OR ("ns"."nspname" = 'public' AND "cl"."relname" = 'audit_logs') OR ("ns"."nspname" = 'public' AND "cl"."relname" = 'platform_settings')) ) "con" INNER JOIN "pg_attribute" "att" ON "att"."attrelid" = "con"."confrelid" AND "att"."attnum" = "con"."child" INNER JOIN "pg_class" "cl" ON "cl"."oid" = "con"."confrelid"  AND "cl"."relispartition" = 'f'INNER JOIN "pg_namespace" "ns" ON "cl"."relnamespace" = "ns"."oid" INNER JOIN "pg_attribute" "att2" ON "att2"."attrelid" = "con"."conrelid" AND "att2"."attnum" = "con"."parent"
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'users' AND "column_name"='role'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'users' AND "column_name"='status'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'rooms' AND "column_name"='status'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'transactions' AND "column_name"='type'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'transactions' AND "column_name"='status'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'game_hands' AND "column_name"='currentPhase'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'player_seats' AND "column_name"='status'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'betting_actions' AND "column_name"='action'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'betting_actions' AND "column_name"='phase'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'audit_logs' AND "column_name"='eventType'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'audit_logs' AND "column_name"='entityType'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'user_role_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'user_status_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'room_status_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'transaction_type_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'transaction_status_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'hand_phase_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'seat_status_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'action_type_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'hand_phase_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'event_type_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'entity_type_enum'
query: SELECT * FROM "information_schema"."tables" WHERE "table_schema" = 'public' AND "table_name" = 'typeorm_metadata'
query: ALTER TABLE "transactions" DROP CONSTRAINT "fk_transaction_user"
query: ALTER TABLE "transactions" DROP CONSTRAINT "fk_transaction_processor"
query: ALTER TABLE "audit_logs" DROP CONSTRAINT "fk_audit_log_user"
query: ALTER TABLE "rooms" DROP CONSTRAINT "fk_room_creator"
query: ALTER TABLE "game_hands" DROP CONSTRAINT "fk_game_hand_room"
query: ALTER TABLE "player_seats" DROP CONSTRAINT "fk_player_seat_game_hand"
query: ALTER TABLE "player_seats" DROP CONSTRAINT "fk_player_seat_user"
query: ALTER TABLE "betting_actions" DROP CONSTRAINT "fk_betting_action_game_hand"
query: ALTER TABLE "betting_actions" DROP CONSTRAINT "fk_betting_action_player"
query: DROP INDEX "public"."idx_user_telegram_id"
query: DROP INDEX "public"."idx_game_hand_players"
query: ALTER TYPE "public"."user_role_enum" RENAME TO "user_role_enum_old"
query: CREATE TYPE "public"."users_role_enum" AS ENUM('player', 'admin')
query: ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT
query: ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"text"::"public"."users_role_enum"
query: ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'player'
query: DROP TYPE "public"."user_role_enum_old"
query: ALTER TYPE "public"."user_status_enum" RENAME TO "user_status_enum_old"
query: CREATE TYPE "public"."users_status_enum" AS ENUM('active', 'suspended', 'banned')
query: ALTER TABLE "users" ALTER COLUMN "status" DROP DEFAULT
query: ALTER TABLE "users" ALTER COLUMN "status" TYPE "public"."users_status_enum" USING "status"::"text"::"public"."users_status_enum"
query: ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'active'
query: DROP TYPE "public"."user_status_enum_old"
query: DROP INDEX "public"."idx_transaction_type_status"
query: ALTER TYPE "public"."transaction_type_enum" RENAME TO "transaction_type_enum_old"
query: CREATE TYPE "public"."transactions_type_enum" AS ENUM('deposit', 'withdrawal', 'game_win', 'game_loss', 'admin_adjustment')
query: ALTER TABLE "transactions" ALTER COLUMN "type" TYPE "public"."transactions_type_enum" USING "type"::"text"::"public"."transactions_type_enum"     
query: DROP TYPE "public"."transaction_type_enum_old"
query: ALTER TYPE "public"."transaction_status_enum" RENAME TO "transaction_status_enum_old"
query: CREATE TYPE "public"."transactions_status_enum" AS ENUM('pending', 'processing', 'completed', 'rejected', 'failed')
query: ALTER TABLE "transactions" ALTER COLUMN "status" DROP DEFAULT
query: ALTER TABLE "transactions" ALTER COLUMN "status" TYPE "public"."transactions_status_enum" USING "status"::"text"::"public"."transactions_status_enum"
query: ALTER TABLE "transactions" ALTER COLUMN "status" SET DEFAULT 'pending'
query: DROP TYPE "public"."transaction_status_enum_old"
query: DROP INDEX "public"."idx_audit_log_entity"
query: ALTER TYPE "public"."event_type_enum" RENAME TO "event_type_enum_old"
query: CREATE TYPE "public"."audit_logs_eventtype_enum" AS ENUM('user_suspended', 'user_banned', 'user_reactivated', 'withdrawal_approved', 'withdrawal_rejected', 'deposit_approved', 'deposit_rejected', 'room_suspended', 'room_closed', 'settings_updated', 'admin_login', 'balance_adjustment')
query: ALTER TABLE "audit_logs" ALTER COLUMN "eventType" TYPE "public"."audit_logs_eventtype_enum" USING "eventType"::"text"::"public"."audit_logs_eventtype_enum"
query: DROP TYPE "public"."event_type_enum_old"
query: ALTER TYPE "public"."entity_type_enum" RENAME TO "entity_type_enum_old"
query: CREATE TYPE "public"."audit_logs_entitytype_enum" AS ENUM('user', 'room', 'transaction', 'game', 'settings')
query: ALTER TABLE "audit_logs" ALTER COLUMN "entityType" TYPE "public"."audit_logs_entitytype_enum" USING "entityType"::"text"::"public"."audit_logs_entitytype_enum"
query: DROP TYPE "public"."entity_type_enum_old"
query: DROP INDEX "public"."idx_room_status_created"
query: ALTER TYPE "public"."room_status_enum" RENAME TO "room_status_enum_old"
query: CREATE TYPE "public"."rooms_status_enum" AS ENUM('waiting', 'active', 'completed', 'suspended')
query: ALTER TABLE "rooms" ALTER COLUMN "status" DROP DEFAULT
query: ALTER TABLE "rooms" ALTER COLUMN "status" TYPE "public"."rooms_status_enum" USING "status"::"text"::"public"."rooms_status_enum"
query: ALTER TABLE "rooms" ALTER COLUMN "status" SET DEFAULT 'waiting'
query: DROP TYPE "public"."room_status_enum_old"
query: ALTER TYPE "public"."hand_phase_enum" RENAME TO "hand_phase_enum_old"
query: CREATE TYPE "public"."game_hands_currentphase_enum" AS ENUM('preflop', 'flop', 'turn', 'river', 'showdown', 'completed')
query: ALTER TABLE "game_hands" ALTER COLUMN "currentPhase" DROP DEFAULT
query: ALTER TABLE "game_hands" ALTER COLUMN "currentPhase" TYPE "public"."game_hands_currentphase_enum" USING "currentPhase"::"text"::"public"."game_hands_currentphase_enum"
query: ALTER TABLE "game_hands" ALTER COLUMN "currentPhase" SET DEFAULT 'preflop'
query: DROP TYPE "public"."hand_phase_enum_old"
query failed: DROP TYPE "public"."hand_phase_enum_old"
error: error: cannot drop type hand_phase_enum_old because other objects depend on it
query: ROLLBACK
[Nest] 4392  - 11/15/2025, 12:47:35 AM   ERROR [TypeOrmModule] Unable to connect to the database. Retrying (7)...
QueryFailedError: cannot drop type hand_phase_enum_old because other objects depend on it
    at PostgresQueryRunner.query (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\driver\src\driver\postgres\PostgresQueryRunner.ts:325:19)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async PostgresQueryRunner.executeQueries (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\query-runner\src\query-runner\BaseQueryRunner.ts:681:13)
    at async PostgresQueryRunner.changeColumn (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\driver\src\driver\postgres\PostgresQueryRunner.ts:2307:9)
    at async PostgresQueryRunner.changeColumns (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\driver\src\driver\postgres\PostgresQueryRunner.ts:2319:13)
    at async RdbmsSchemaBuilder.updateExistColumns (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\schema-builder\src\schema-builder\RdbmsSchemaBuilder.ts:969:13)
    at async RdbmsSchemaBuilder.executeSchemaSyncOperationsInProperOrder (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\schema-builder\src\schema-builder\RdbmsSchemaBuilder.ts:229:9)
    at async RdbmsSchemaBuilder.build (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\schema-builder\src\schema-builder\RdbmsSchemaBuilder.ts:95:13)  
    at async DataSource.synchronize (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\data-source\src\data-source\DataSource.ts:340:9)
    at async DataSource.initialize (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\data-source\src\data-source\DataSource.ts:278:43)
query: SELECT version()
query: SELECT * FROM current_schema()
query: CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
query: START TRANSACTION
query: SELECT * FROM current_schema()
query: SELECT * FROM current_database()
query: SELECT "table_schema", "table_name", obj_description(('"' || "table_schema" || '"."' || "table_name" || '"')::regclass, 'pg_class') AS table_comment FROM "information_schema"."tables" WHERE ("table_schema" = 'public' AND "table_name" = 'users') OR ("table_schema" = 'public' AND "table_name" = 'transactions') OR ("table_schema" = 'public' AND "table_name" = 'audit_logs') OR ("table_schema" = 'public' AND "table_name" = 'rooms') OR ("table_schema" = 
'public' AND "table_name" = 'game_hands') OR ("table_schema" = 'public' AND "table_name" = 'player_seats') OR ("table_schema" = 'public' AND "table_name" = 'betting_actions') OR ("table_schema" = 'public' AND "table_name" = 'platform_settings')
query: SELECT TRUE FROM information_schema.columns WHERE table_name = 'pg_class' and column_name = 'relispartition'
query: SELECT columns.*, pg_catalog.col_description(('"' || table_catalog || '"."' || table_schema || '"."' || table_name || '"')::regclass::oid, ordinal_position) AS description, ('"' || "udt_schema" || '"."' || "udt_name" || '"')::"regtype"::text AS "regtype", pg_catalog.format_type("col_attr"."atttypid", "col_attr"."atttypmod") AS "format_type" FROM "information_schema"."columns" LEFT JOIN "pg_catalog"."pg_attribute" AS "col_attr" ON "col_attr"."attname" = "columns"."column_name" AND "col_attr"."attrelid" = ( SELECT "cls"."oid" FROM "pg_catalog"."pg_class" AS "cls" LEFT JOIN "pg_catalog"."pg_namespace" AS "ns" ON "ns"."oid" = "cls"."relnamespace" WHERE "cls"."relname" = "columns"."table_name" AND "ns"."nspname" = "columns"."table_schema" ) WHERE ("table_schema" = 'public' AND "table_name" = 'users') OR ("table_schema" = 'public' AND "table_name" = 'rooms') OR ("table_schema" = 'public' AND "table_name" = 'transactions') OR ("table_schema" = 'public' AND "table_name" = 'game_hands') OR ("table_schema" = 'public' AND "table_name" = 'player_seats') OR ("table_schema" = 'public' AND "table_name" = 'betting_actions') OR ("table_schema" = 'public' AND "table_name" = 'audit_logs') OR ("table_schema" = 'public' AND "table_name" = 'platform_settings')
query: SELECT "ns"."nspname" AS "table_schema", "t"."relname" AS "table_name", "cnst"."conname" AS "constraint_name", pg_get_constraintdef("cnst"."oid") 
AS "expression", CASE "cnst"."contype" WHEN 'p' THEN 'PRIMARY' WHEN 'u' THEN 'UNIQUE' WHEN 'c' THEN 'CHECK' WHEN 'x' THEN 'EXCLUDE' END AS "constraint_type", "a"."attname" AS "column_name" FROM "pg_constraint" "cnst" INNER JOIN "pg_class" "t" ON "t"."oid" = "cnst"."conrelid" INNER JOIN "pg_namespace" "ns" ON "ns"."oid" = "cnst"."connamespace" LEFT JOIN "pg_attribute" "a" ON "a"."attrelid" = "cnst"."conrelid" AND "a"."attnum" = ANY ("cnst"."conkey") WHERE 
"t"."relkind" IN ('r', 'p') AND (("ns"."nspname" = 'public' AND "t"."relname" = 'users') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'rooms') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'transactions') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'game_hands') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'player_seats') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'betting_actions') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'audit_logs') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'platform_settings'))
query: SELECT "ns"."nspname" AS "table_schema", "t"."relname" AS "table_name", "i"."relname" AS "constraint_name", "a"."attname" AS "column_name", CASE "ix"."indisunique" WHEN 't' THEN 'TRUE' ELSE'FALSE' END AS "is_unique", pg_get_expr("ix"."indpred", "ix"."indrelid") AS "condition", "types"."typname" AS 
"type_name", "am"."amname" AS "index_type" FROM "pg_class" "t" INNER JOIN "pg_index" "ix" ON "ix"."indrelid" = "t"."oid" INNER JOIN "pg_attribute" "a" ON "a"."attrelid" = "t"."oid"  AND "a"."attnum" = ANY ("ix"."indkey") INNER JOIN "pg_namespace" "ns" ON "ns"."oid" = "t"."relnamespace" INNER JOIN "pg_class" "i" ON "i"."oid" = "ix"."indexrelid" INNER JOIN "pg_type" "types" ON "types"."oid" = "a"."atttypid" INNER JOIN "pg_am" "am" ON "i"."relam" = "am"."oid" LEFT JOIN "pg_constraint" "cnst" ON "cnst"."conname" = "i"."relname" WHERE "t"."relkind" IN ('r', 'p') AND "cnst"."contype" IS NULL AND (("ns"."nspname" = 'public' AND "t"."relname" = 'users') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'rooms') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'transactions') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'game_hands') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'player_seats') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'betting_actions') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'audit_logs') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'platform_settings'))
query: SELECT "con"."conname" AS "constraint_name", "con"."nspname" AS "table_schema", "con"."relname" AS "table_name", "att2"."attname" AS "column_name", "ns"."nspname" AS "referenced_table_schema", "cl"."relname" AS "referenced_table_name", "att"."attname" AS "referenced_column_name", "con"."confdeltype" AS "on_delete", "con"."confupdtype" AS "on_update", "con"."condeferrable" AS "deferrable", "con"."condeferred" AS "deferred" FROM ( SELECT UNNEST ("con1"."conkey") AS "parent", UNNEST ("con1"."confkey") AS "child", "con1"."confrelid", "con1"."conrelid", "con1"."conname", "con1"."contype", "ns"."nspname", "cl"."relname", "con1"."condeferrable", CASE WHEN "con1"."condeferred" THEN 'INITIALLY DEFERRED' ELSE 'INITIALLY IMMEDIATE' END as condeferred, CASE "con1"."confdeltype" WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT' WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END as "confdeltype", CASE "con1"."confupdtype" WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT' WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END as "confupdtype" FROM "pg_class" "cl" INNER JOIN "pg_namespace" "ns" ON "cl"."relnamespace" = "ns"."oid" INNER JOIN "pg_constraint" 
"con1" ON "con1"."conrelid" = "cl"."oid" WHERE "con1"."contype" = 'f' AND (("ns"."nspname" = 'public' AND "cl"."relname" = 'users') OR ("ns"."nspname" = 
'public' AND "cl"."relname" = 'rooms') OR ("ns"."nspname" = 'public' AND "cl"."relname" = 'transactions') OR ("ns"."nspname" = 'public' AND "cl"."relname" = 'game_hands') OR ("ns"."nspname" = 'public' AND "cl"."relname" = 'player_seats') OR ("ns"."nspname" = 'public' AND "cl"."relname" = 'betting_actions') OR ("ns"."nspname" = 'public' AND "cl"."relname" = 'audit_logs') OR ("ns"."nspname" = 'public' AND "cl"."relname" = 'platform_settings')) ) "con" INNER JOIN "pg_attribute" "att" ON "att"."attrelid" = "con"."confrelid" AND "att"."attnum" = "con"."child" INNER JOIN "pg_class" "cl" ON "cl"."oid" = "con"."confrelid"  AND "cl"."relispartition" = 'f'INNER JOIN "pg_namespace" "ns" ON "cl"."relnamespace" = "ns"."oid" INNER JOIN "pg_attribute" "att2" ON "att2"."attrelid" = "con"."conrelid" AND "att2"."attnum" = "con"."parent"
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'users' AND "column_name"='role'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'users' AND "column_name"='status'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'rooms' AND "column_name"='status'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'transactions' AND "column_name"='type'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'transactions' AND "column_name"='status'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'game_hands' AND "column_name"='currentPhase'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'player_seats' AND "column_name"='status'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'betting_actions' AND "column_name"='action'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'betting_actions' AND "column_name"='phase'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'audit_logs' AND "column_name"='eventType'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'audit_logs' AND "column_name"='entityType'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'user_role_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'user_status_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'room_status_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'transaction_type_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'transaction_status_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'hand_phase_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'seat_status_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'action_type_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'hand_phase_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'event_type_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'entity_type_enum'
query: SELECT * FROM "information_schema"."tables" WHERE "table_schema" = 'public' AND "table_name" = 'typeorm_metadata'
query: ALTER TABLE "transactions" DROP CONSTRAINT "fk_transaction_user"
query: ALTER TABLE "transactions" DROP CONSTRAINT "fk_transaction_processor"
query: ALTER TABLE "audit_logs" DROP CONSTRAINT "fk_audit_log_user"
query: ALTER TABLE "rooms" DROP CONSTRAINT "fk_room_creator"
query: ALTER TABLE "game_hands" DROP CONSTRAINT "fk_game_hand_room"
query: ALTER TABLE "player_seats" DROP CONSTRAINT "fk_player_seat_game_hand"
query: ALTER TABLE "player_seats" DROP CONSTRAINT "fk_player_seat_user"
query: ALTER TABLE "betting_actions" DROP CONSTRAINT "fk_betting_action_game_hand"
query: ALTER TABLE "betting_actions" DROP CONSTRAINT "fk_betting_action_player"
query: DROP INDEX "public"."idx_user_telegram_id"
query: DROP INDEX "public"."idx_game_hand_players"
query: ALTER TYPE "public"."user_role_enum" RENAME TO "user_role_enum_old"
query: CREATE TYPE "public"."users_role_enum" AS ENUM('player', 'admin')
query: ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT
query: ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"text"::"public"."users_role_enum"
query: ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'player'
query: DROP TYPE "public"."user_role_enum_old"
query: ALTER TYPE "public"."user_status_enum" RENAME TO "user_status_enum_old"
query: CREATE TYPE "public"."users_status_enum" AS ENUM('active', 'suspended', 'banned')
query: ALTER TABLE "users" ALTER COLUMN "status" DROP DEFAULT
query: ALTER TABLE "users" ALTER COLUMN "status" TYPE "public"."users_status_enum" USING "status"::"text"::"public"."users_status_enum"
query: ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'active'
query: DROP TYPE "public"."user_status_enum_old"
query: DROP INDEX "public"."idx_transaction_type_status"
query: ALTER TYPE "public"."transaction_type_enum" RENAME TO "transaction_type_enum_old"
query: CREATE TYPE "public"."transactions_type_enum" AS ENUM('deposit', 'withdrawal', 'game_win', 'game_loss', 'admin_adjustment')
query: ALTER TABLE "transactions" ALTER COLUMN "type" TYPE "public"."transactions_type_enum" USING "type"::"text"::"public"."transactions_type_enum"     
query: DROP TYPE "public"."transaction_type_enum_old"
query: ALTER TYPE "public"."transaction_status_enum" RENAME TO "transaction_status_enum_old"
query: CREATE TYPE "public"."transactions_status_enum" AS ENUM('pending', 'processing', 'completed', 'rejected', 'failed')
query: ALTER TABLE "transactions" ALTER COLUMN "status" DROP DEFAULT
query: ALTER TABLE "transactions" ALTER COLUMN "status" TYPE "public"."transactions_status_enum" USING "status"::"text"::"public"."transactions_status_enum"
query: ALTER TABLE "transactions" ALTER COLUMN "status" SET DEFAULT 'pending'
query: DROP TYPE "public"."transaction_status_enum_old"
query: DROP INDEX "public"."idx_audit_log_entity"
query: ALTER TYPE "public"."event_type_enum" RENAME TO "event_type_enum_old"
query: CREATE TYPE "public"."audit_logs_eventtype_enum" AS ENUM('user_suspended', 'user_banned', 'user_reactivated', 'withdrawal_approved', 'withdrawal_rejected', 'deposit_approved', 'deposit_rejected', 'room_suspended', 'room_closed', 'settings_updated', 'admin_login', 'balance_adjustment')
query: ALTER TABLE "audit_logs" ALTER COLUMN "eventType" TYPE "public"."audit_logs_eventtype_enum" USING "eventType"::"text"::"public"."audit_logs_eventtype_enum"
query: DROP TYPE "public"."event_type_enum_old"
query: ALTER TYPE "public"."entity_type_enum" RENAME TO "entity_type_enum_old"
query: CREATE TYPE "public"."audit_logs_entitytype_enum" AS ENUM('user', 'room', 'transaction', 'game', 'settings')
query: ALTER TABLE "audit_logs" ALTER COLUMN "entityType" TYPE "public"."audit_logs_entitytype_enum" USING "entityType"::"text"::"public"."audit_logs_entitytype_enum"
query: DROP TYPE "public"."entity_type_enum_old"
query: DROP INDEX "public"."idx_room_status_created"
query: ALTER TYPE "public"."room_status_enum" RENAME TO "room_status_enum_old"
query: CREATE TYPE "public"."rooms_status_enum" AS ENUM('waiting', 'active', 'completed', 'suspended')
query: ALTER TABLE "rooms" ALTER COLUMN "status" DROP DEFAULT
query: ALTER TABLE "rooms" ALTER COLUMN "status" TYPE "public"."rooms_status_enum" USING "status"::"text"::"public"."rooms_status_enum"
query: ALTER TABLE "rooms" ALTER COLUMN "status" SET DEFAULT 'waiting'
query: DROP TYPE "public"."room_status_enum_old"
query: ALTER TYPE "public"."hand_phase_enum" RENAME TO "hand_phase_enum_old"
query: CREATE TYPE "public"."game_hands_currentphase_enum" AS ENUM('preflop', 'flop', 'turn', 'river', 'showdown', 'completed')
query: ALTER TABLE "game_hands" ALTER COLUMN "currentPhase" DROP DEFAULT
query: ALTER TABLE "game_hands" ALTER COLUMN "currentPhase" TYPE "public"."game_hands_currentphase_enum" USING "currentPhase"::"text"::"public"."game_hands_currentphase_enum"
query: ALTER TABLE "game_hands" ALTER COLUMN "currentPhase" SET DEFAULT 'preflop'
query: DROP TYPE "public"."hand_phase_enum_old"
query failed: DROP TYPE "public"."hand_phase_enum_old"
error: error: cannot drop type hand_phase_enum_old because other objects depend on it
query: ROLLBACK
[Nest] 4392  - 11/15/2025, 12:47:39 AM   ERROR [TypeOrmModule] Unable to connect to the database. Retrying (8)...
QueryFailedError: cannot drop type hand_phase_enum_old because other objects depend on it
    at PostgresQueryRunner.query (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\driver\src\driver\postgres\PostgresQueryRunner.ts:325:19)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async PostgresQueryRunner.executeQueries (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\query-runner\src\query-runner\BaseQueryRunner.ts:681:13)
    at async PostgresQueryRunner.changeColumn (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\driver\src\driver\postgres\PostgresQueryRunner.ts:2307:9)
    at async PostgresQueryRunner.changeColumns (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\driver\src\driver\postgres\PostgresQueryRunner.ts:2319:13)
    at async RdbmsSchemaBuilder.updateExistColumns (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\schema-builder\src\schema-builder\RdbmsSchemaBuilder.ts:969:13)
    at async RdbmsSchemaBuilder.executeSchemaSyncOperationsInProperOrder (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\schema-builder\src\schema-builder\RdbmsSchemaBuilder.ts:229:9)
    at async RdbmsSchemaBuilder.build (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\schema-builder\src\schema-builder\RdbmsSchemaBuilder.ts:95:13)  
    at async DataSource.synchronize (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\data-source\src\data-source\DataSource.ts:340:9)
    at async DataSource.initialize (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\data-source\src\data-source\DataSource.ts:278:43)
query: SELECT version()
query: SELECT * FROM current_schema()
query: CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
query: START TRANSACTION
query: SELECT * FROM current_schema()
query: SELECT * FROM current_database()
query: SELECT "table_schema", "table_name", obj_description(('"' || "table_schema" || '"."' || "table_name" || '"')::regclass, 'pg_class') AS table_comment FROM "information_schema"."tables" WHERE ("table_schema" = 'public' AND "table_name" = 'users') OR ("table_schema" = 'public' AND "table_name" = 'transactions') OR ("table_schema" = 'public' AND "table_name" = 'audit_logs') OR ("table_schema" = 'public' AND "table_name" = 'rooms') OR ("table_schema" = 
'public' AND "table_name" = 'game_hands') OR ("table_schema" = 'public' AND "table_name" = 'player_seats') OR ("table_schema" = 'public' AND "table_name" = 'betting_actions') OR ("table_schema" = 'public' AND "table_name" = 'platform_settings')
query: SELECT TRUE FROM information_schema.columns WHERE table_name = 'pg_class' and column_name = 'relispartition'
query: SELECT columns.*, pg_catalog.col_description(('"' || table_catalog || '"."' || table_schema || '"."' || table_name || '"')::regclass::oid, ordinal_position) AS description, ('"' || "udt_schema" || '"."' || "udt_name" || '"')::"regtype"::text AS "regtype", pg_catalog.format_type("col_attr"."atttypid", "col_attr"."atttypmod") AS "format_type" FROM "information_schema"."columns" LEFT JOIN "pg_catalog"."pg_attribute" AS "col_attr" ON "col_attr"."attname" = "columns"."column_name" AND "col_attr"."attrelid" = ( SELECT "cls"."oid" FROM "pg_catalog"."pg_class" AS "cls" LEFT JOIN "pg_catalog"."pg_namespace" AS "ns" ON "ns"."oid" = "cls"."relnamespace" WHERE "cls"."relname" = "columns"."table_name" AND "ns"."nspname" = "columns"."table_schema" ) WHERE ("table_schema" = 'public' AND "table_name" = 'users') OR ("table_schema" = 'public' AND "table_name" = 'rooms') OR ("table_schema" = 'public' AND "table_name" = 'transactions') OR ("table_schema" = 'public' AND "table_name" = 'game_hands') OR ("table_schema" = 'public' AND "table_name" = 'player_seats') OR ("table_schema" = 'public' AND "table_name" = 'betting_actions') OR ("table_schema" = 'public' AND "table_name" = 'audit_logs') OR ("table_schema" = 'public' AND "table_name" = 'platform_settings')
query: SELECT "ns"."nspname" AS "table_schema", "t"."relname" AS "table_name", "cnst"."conname" AS "constraint_name", pg_get_constraintdef("cnst"."oid") 
AS "expression", CASE "cnst"."contype" WHEN 'p' THEN 'PRIMARY' WHEN 'u' THEN 'UNIQUE' WHEN 'c' THEN 'CHECK' WHEN 'x' THEN 'EXCLUDE' END AS "constraint_type", "a"."attname" AS "column_name" FROM "pg_constraint" "cnst" INNER JOIN "pg_class" "t" ON "t"."oid" = "cnst"."conrelid" INNER JOIN "pg_namespace" "ns" ON "ns"."oid" = "cnst"."connamespace" LEFT JOIN "pg_attribute" "a" ON "a"."attrelid" = "cnst"."conrelid" AND "a"."attnum" = ANY ("cnst"."conkey") WHERE 
"t"."relkind" IN ('r', 'p') AND (("ns"."nspname" = 'public' AND "t"."relname" = 'users') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'rooms') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'transactions') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'game_hands') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'player_seats') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'betting_actions') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'audit_logs') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'platform_settings'))
query: SELECT "ns"."nspname" AS "table_schema", "t"."relname" AS "table_name", "i"."relname" AS "constraint_name", "a"."attname" AS "column_name", CASE "ix"."indisunique" WHEN 't' THEN 'TRUE' ELSE'FALSE' END AS "is_unique", pg_get_expr("ix"."indpred", "ix"."indrelid") AS "condition", "types"."typname" AS 
"type_name", "am"."amname" AS "index_type" FROM "pg_class" "t" INNER JOIN "pg_index" "ix" ON "ix"."indrelid" = "t"."oid" INNER JOIN "pg_attribute" "a" ON "a"."attrelid" = "t"."oid"  AND "a"."attnum" = ANY ("ix"."indkey") INNER JOIN "pg_namespace" "ns" ON "ns"."oid" = "t"."relnamespace" INNER JOIN "pg_class" "i" ON "i"."oid" = "ix"."indexrelid" INNER JOIN "pg_type" "types" ON "types"."oid" = "a"."atttypid" INNER JOIN "pg_am" "am" ON "i"."relam" = "am"."oid" LEFT JOIN "pg_constraint" "cnst" ON "cnst"."conname" = "i"."relname" WHERE "t"."relkind" IN ('r', 'p') AND "cnst"."contype" IS NULL AND (("ns"."nspname" = 'public' AND "t"."relname" = 'users') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'rooms') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'transactions') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'game_hands') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'player_seats') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'betting_actions') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'audit_logs') OR ("ns"."nspname" = 'public' AND "t"."relname" = 'platform_settings'))
query: SELECT "con"."conname" AS "constraint_name", "con"."nspname" AS "table_schema", "con"."relname" AS "table_name", "att2"."attname" AS "column_name", "ns"."nspname" AS "referenced_table_schema", "cl"."relname" AS "referenced_table_name", "att"."attname" AS "referenced_column_name", "con"."confdeltype" AS "on_delete", "con"."confupdtype" AS "on_update", "con"."condeferrable" AS "deferrable", "con"."condeferred" AS "deferred" FROM ( SELECT UNNEST ("con1"."conkey") AS "parent", UNNEST ("con1"."confkey") AS "child", "con1"."confrelid", "con1"."conrelid", "con1"."conname", "con1"."contype", "ns"."nspname", "cl"."relname", "con1"."condeferrable", CASE WHEN "con1"."condeferred" THEN 'INITIALLY DEFERRED' ELSE 'INITIALLY IMMEDIATE' END as condeferred, CASE "con1"."confdeltype" WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT' WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END as "confdeltype", CASE "con1"."confupdtype" WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT' WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END as "confupdtype" FROM "pg_class" "cl" INNER JOIN "pg_namespace" "ns" ON "cl"."relnamespace" = "ns"."oid" INNER JOIN "pg_constraint" 
"con1" ON "con1"."conrelid" = "cl"."oid" WHERE "con1"."contype" = 'f' AND (("ns"."nspname" = 'public' AND "cl"."relname" = 'users') OR ("ns"."nspname" = 
'public' AND "cl"."relname" = 'rooms') OR ("ns"."nspname" = 'public' AND "cl"."relname" = 'transactions') OR ("ns"."nspname" = 'public' AND "cl"."relname" = 'game_hands') OR ("ns"."nspname" = 'public' AND "cl"."relname" = 'player_seats') OR ("ns"."nspname" = 'public' AND "cl"."relname" = 'betting_actions') OR ("ns"."nspname" = 'public' AND "cl"."relname" = 'audit_logs') OR ("ns"."nspname" = 'public' AND "cl"."relname" = 'platform_settings')) ) "con" INNER JOIN "pg_attribute" "att" ON "att"."attrelid" = "con"."confrelid" AND "att"."attnum" = "con"."child" INNER JOIN "pg_class" "cl" ON "cl"."oid" = "con"."confrelid"  AND "cl"."relispartition" = 'f'INNER JOIN "pg_namespace" "ns" ON "cl"."relnamespace" = "ns"."oid" INNER JOIN "pg_attribute" "att2" ON "att2"."attrelid" = "con"."conrelid" AND "att2"."attnum" = "con"."parent"
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'users' AND "column_name"='role'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'users' AND "column_name"='status'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'rooms' AND "column_name"='status'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'transactions' AND "column_name"='type'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'transactions' AND "column_name"='status'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'game_hands' AND "column_name"='currentPhase'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'player_seats' AND "column_name"='status'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'betting_actions' AND "column_name"='action'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'betting_actions' AND "column_name"='phase'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'audit_logs' AND "column_name"='eventType'
query: SELECT "udt_schema", "udt_name" FROM "information_schema"."columns" WHERE "table_schema" = 'public' AND "table_name" = 'audit_logs' AND "column_name"='entityType'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'user_role_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'user_status_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'room_status_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'transaction_type_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'transaction_status_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'hand_phase_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'seat_status_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'action_type_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'hand_phase_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'event_type_enum'
query: SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" WHERE "n"."nspname" = 'public' AND "t"."typname" = 'entity_type_enum'
query: SELECT * FROM "information_schema"."tables" WHERE "table_schema" = 'public' AND "table_name" = 'typeorm_metadata'
query: ALTER TABLE "transactions" DROP CONSTRAINT "fk_transaction_user"
query: ALTER TABLE "transactions" DROP CONSTRAINT "fk_transaction_processor"
query: ALTER TABLE "audit_logs" DROP CONSTRAINT "fk_audit_log_user"
query: ALTER TABLE "rooms" DROP CONSTRAINT "fk_room_creator"
query: ALTER TABLE "game_hands" DROP CONSTRAINT "fk_game_hand_room"
query: ALTER TABLE "player_seats" DROP CONSTRAINT "fk_player_seat_game_hand"
query: ALTER TABLE "player_seats" DROP CONSTRAINT "fk_player_seat_user"
query: ALTER TABLE "betting_actions" DROP CONSTRAINT "fk_betting_action_game_hand"
query: ALTER TABLE "betting_actions" DROP CONSTRAINT "fk_betting_action_player"
query: DROP INDEX "public"."idx_user_telegram_id"
query: DROP INDEX "public"."idx_game_hand_players"
query: ALTER TYPE "public"."user_role_enum" RENAME TO "user_role_enum_old"
query: CREATE TYPE "public"."users_role_enum" AS ENUM('player', 'admin')
query: ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT
query: ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"text"::"public"."users_role_enum"
query: ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'player'
query: DROP TYPE "public"."user_role_enum_old"
query: ALTER TYPE "public"."user_status_enum" RENAME TO "user_status_enum_old"
query: CREATE TYPE "public"."users_status_enum" AS ENUM('active', 'suspended', 'banned')
query: ALTER TABLE "users" ALTER COLUMN "status" DROP DEFAULT
query: ALTER TABLE "users" ALTER COLUMN "status" TYPE "public"."users_status_enum" USING "status"::"text"::"public"."users_status_enum"
query: ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'active'
query: DROP TYPE "public"."user_status_enum_old"
query: DROP INDEX "public"."idx_transaction_type_status"
query: ALTER TYPE "public"."transaction_type_enum" RENAME TO "transaction_type_enum_old"
query: CREATE TYPE "public"."transactions_type_enum" AS ENUM('deposit', 'withdrawal', 'game_win', 'game_loss', 'admin_adjustment')
query: ALTER TABLE "transactions" ALTER COLUMN "type" TYPE "public"."transactions_type_enum" USING "type"::"text"::"public"."transactions_type_enum"     
query: DROP TYPE "public"."transaction_type_enum_old"
query: ALTER TYPE "public"."transaction_status_enum" RENAME TO "transaction_status_enum_old"
query: CREATE TYPE "public"."transactions_status_enum" AS ENUM('pending', 'processing', 'completed', 'rejected', 'failed')
query: ALTER TABLE "transactions" ALTER COLUMN "status" DROP DEFAULT
query: ALTER TABLE "transactions" ALTER COLUMN "status" TYPE "public"."transactions_status_enum" USING "status"::"text"::"public"."transactions_status_enum"
query: ALTER TABLE "transactions" ALTER COLUMN "status" SET DEFAULT 'pending'
query: DROP TYPE "public"."transaction_status_enum_old"
query: DROP INDEX "public"."idx_audit_log_entity"
query: ALTER TYPE "public"."event_type_enum" RENAME TO "event_type_enum_old"
query: CREATE TYPE "public"."audit_logs_eventtype_enum" AS ENUM('user_suspended', 'user_banned', 'user_reactivated', 'withdrawal_approved', 'withdrawal_rejected', 'deposit_approved', 'deposit_rejected', 'room_suspended', 'room_closed', 'settings_updated', 'admin_login', 'balance_adjustment')
query: ALTER TABLE "audit_logs" ALTER COLUMN "eventType" TYPE "public"."audit_logs_eventtype_enum" USING "eventType"::"text"::"public"."audit_logs_eventtype_enum"
query: DROP TYPE "public"."event_type_enum_old"
query: ALTER TYPE "public"."entity_type_enum" RENAME TO "entity_type_enum_old"
query: CREATE TYPE "public"."audit_logs_entitytype_enum" AS ENUM('user', 'room', 'transaction', 'game', 'settings')
query: ALTER TABLE "audit_logs" ALTER COLUMN "entityType" TYPE "public"."audit_logs_entitytype_enum" USING "entityType"::"text"::"public"."audit_logs_entitytype_enum"
query: DROP TYPE "public"."entity_type_enum_old"
query: DROP INDEX "public"."idx_room_status_created"
query: ALTER TYPE "public"."room_status_enum" RENAME TO "room_status_enum_old"
query: CREATE TYPE "public"."rooms_status_enum" AS ENUM('waiting', 'active', 'completed', 'suspended')
query: ALTER TABLE "rooms" ALTER COLUMN "status" DROP DEFAULT
query: ALTER TABLE "rooms" ALTER COLUMN "status" TYPE "public"."rooms_status_enum" USING "status"::"text"::"public"."rooms_status_enum"
query: ALTER TABLE "rooms" ALTER COLUMN "status" SET DEFAULT 'waiting'
query: DROP TYPE "public"."room_status_enum_old"
query: ALTER TYPE "public"."hand_phase_enum" RENAME TO "hand_phase_enum_old"
query: CREATE TYPE "public"."game_hands_currentphase_enum" AS ENUM('preflop', 'flop', 'turn', 'river', 'showdown', 'completed')
query: ALTER TABLE "game_hands" ALTER COLUMN "currentPhase" DROP DEFAULT
query: ALTER TABLE "game_hands" ALTER COLUMN "currentPhase" TYPE "public"."game_hands_currentphase_enum" USING "currentPhase"::"text"::"public"."game_hands_currentphase_enum"
query: ALTER TABLE "game_hands" ALTER COLUMN "currentPhase" SET DEFAULT 'preflop'
query: DROP TYPE "public"."hand_phase_enum_old"
query failed: DROP TYPE "public"."hand_phase_enum_old"
error: error: cannot drop type hand_phase_enum_old because other objects depend on it
query: ROLLBACK
[Nest] 4392  - 11/15/2025, 12:47:42 AM   ERROR [TypeOrmModule] Unable to connect to the database. Retrying (9)...
QueryFailedError: cannot drop type hand_phase_enum_old because other objects depend on it
    at PostgresQueryRunner.query (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\driver\src\driver\postgres\PostgresQueryRunner.ts:325:19)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async PostgresQueryRunner.executeQueries (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\query-runner\src\query-runner\BaseQueryRunner.ts:681:13)
    at async PostgresQueryRunner.changeColumn (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\driver\src\driver\postgres\PostgresQueryRunner.ts:2307:9)
    at async PostgresQueryRunner.changeColumns (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\driver\src\driver\postgres\PostgresQueryRunner.ts:2319:13)
    at async RdbmsSchemaBuilder.updateExistColumns (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\schema-builder\src\schema-builder\RdbmsSchemaBuilder.ts:969:13)
    at async RdbmsSchemaBuilder.executeSchemaSyncOperationsInProperOrder (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\schema-builder\src\schema-builder\RdbmsSchemaBuilder.ts:229:9)
    at async RdbmsSchemaBuilder.build (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\schema-builder\src\schema-builder\RdbmsSchemaBuilder.ts:95:13)  
    at async DataSource.synchronize (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\data-source\src\data-source\DataSource.ts:340:9)
    at async DataSource.initialize (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\data-source\src\data-source\DataSource.ts:278:43)
[Nest] 4392  - 11/15/2025, 12:47:42 AM   ERROR [ExceptionHandler] QueryFailedError: cannot drop type hand_phase_enum_old because other objects depend on 
it
    at PostgresQueryRunner.query (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\driver\src\driver\postgres\PostgresQueryRunner.ts:325:19)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async PostgresQueryRunner.executeQueries (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\query-runner\src\query-runner\BaseQueryRunner.ts:681:13)
    at async PostgresQueryRunner.changeColumn (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\driver\src\driver\postgres\PostgresQueryRunner.ts:2307:9)
    at async PostgresQueryRunner.changeColumns (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\driver\src\driver\postgres\PostgresQueryRunner.ts:2319:13)
    at async RdbmsSchemaBuilder.updateExistColumns (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\schema-builder\src\schema-builder\RdbmsSchemaBuilder.ts:969:13)
    at async RdbmsSchemaBuilder.executeSchemaSyncOperationsInProperOrder (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\schema-builder\src\schema-builder\RdbmsSchemaBuilder.ts:229:9)
    at async RdbmsSchemaBuilder.build (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\schema-builder\src\schema-builder\RdbmsSchemaBuilder.ts:95:13)  
    at async DataSource.synchronize (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\data-source\src\data-source\DataSource.ts:340:9)
    at async DataSource.initialize (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\data-source\src\data-source\DataSource.ts:278:43) {
  query: 'DROP TYPE "public"."hand_phase_enum_old"',
  parameters: undefined,
  driverError: error: cannot drop type hand_phase_enum_old because other objects depend on it
      at C:\WebDev\PWGaming_2\backend\node_modules\pg\lib\client.js:545:17
      at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
      at async PostgresQueryRunner.query (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\driver\src\driver\postgres\PostgresQueryRunner.ts:254:25)    
      at async PostgresQueryRunner.executeQueries (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\query-runner\src\query-runner\BaseQueryRunner.ts:681:13)
      at async PostgresQueryRunner.changeColumn (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\driver\src\driver\postgres\PostgresQueryRunner.ts:2307:9)
      at async PostgresQueryRunner.changeColumns (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\driver\src\driver\postgres\PostgresQueryRunner.ts:2319:13)
      at async RdbmsSchemaBuilder.updateExistColumns (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\schema-builder\src\schema-builder\RdbmsSchemaBuilder.ts:969:13)
      at async RdbmsSchemaBuilder.executeSchemaSyncOperationsInProperOrder (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\schema-builder\src\schema-builder\RdbmsSchemaBuilder.ts:229:9)
      at async RdbmsSchemaBuilder.build (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\schema-builder\src\schema-builder\RdbmsSchemaBuilder.ts:95:13)      at async DataSource.synchronize (C:\WebDev\PWGaming_2\backend\node_modules\typeorm\data-source\src\data-source\DataSource.ts:340:9) {
    length: 275,
    severity: 'ERROR',
    code: '2BP01',
    detail: 'column phase of table betting_actions depends on type hand_phase_enum_old',
    hint: 'Use DROP ... CASCADE to drop the dependent objects too.',
    position: undefined,
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'dependency.c',
    line: '1196',
    routine: 'reportDependentObjects'
  },
  length: 275,
  severity: 'ERROR',
  code: '2BP01',
  detail: 'column phase of table betting_actions depends on type hand_phase_enum_old',
  hint: 'Use DROP ... CASCADE to drop the dependent objects too.',
  position: undefined,
  internalPosition: undefined,
  internalQuery: undefined,
  where: undefined,
  schema: undefined,
  table: undefined,
  column: undefined,
  dataType: undefined,
  constraint: undefined,
  file: 'dependency.c',
  line: '1196',
  routine: 'reportDependentObjects'
}