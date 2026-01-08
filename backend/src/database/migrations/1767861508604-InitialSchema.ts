import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1767861508604 implements MigrationInterface {
    name = 'InitialSchema1767861508604'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" text, "price" numeric(10,2) NOT NULL, "image_url" integer, "available_stock" integer NOT NULL DEFAULT '0', "reserved_stock" integer NOT NULL DEFAULT '0', "sold_stock" integer NOT NULL DEFAULT '0', "version" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "CHK_83fc4f286e76e16ddd2e5b6137" CHECK (available_stock >= 0), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1afc0a5dc828d56f9e6f361940" ON "products" ("available_stock") `);
        await queryRunner.query(`CREATE INDEX "IDX_995d8194c43edfc98838cabc5a" ON "products" ("created_at") `);
        await queryRunner.query(`CREATE TABLE "reservation_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "reservation_id" uuid NOT NULL, "product_id" uuid NOT NULL, "quantity" integer NOT NULL, "price_snapshot" numeric(10,2) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_bfc06fb7312bf99dd93bbe73844" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."reservations_status_enum" AS ENUM('ACTIVE', 'EXPIRED', 'CONVERTED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "reservations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "status" "public"."reservations_status_enum" NOT NULL DEFAULT 'ACTIVE', "expires_at" TIMESTAMP NOT NULL, "idempotency_key" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_6b0a68b6082ee14612e6b5cbc44" UNIQUE ("idempotency_key"), CONSTRAINT "PK_da95cef71b617ac35dc5bcda243" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c42f5dcdd13d6e63ee44b4cb23" ON "reservations" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_98b848a943fd38687f0caa171a" ON "reservations" ("expires_at") `);
        await queryRunner.query(`CREATE TABLE "order_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order_id" uuid NOT NULL, "product_id" uuid NOT NULL, "quantity" integer NOT NULL, "price_snapshot" numeric(10,2) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."orders_status_enum" AS ENUM('PENDING_PAYMENT', 'PAID', 'CANCELLED', 'EXPIRED')`);
        await queryRunner.query(`CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "reservation_id" uuid, "status" "public"."orders_status_enum" NOT NULL DEFAULT 'PENDING_PAYMENT', "total_amount" numeric(10,2) NOT NULL, "payment_id" character varying, "payment_expires_at" TIMESTAMP, "paid_at" TIMESTAMP, "idempotency_key" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_45bdd131d3c34179a7b0f37d15b" UNIQUE ("reservation_id"), CONSTRAINT "UQ_5b3e94bd2aedc184f9ad8c10439" UNIQUE ("payment_id"), CONSTRAINT "UQ_59d6b7756aeb6cbb43a093d15a1" UNIQUE ("idempotency_key"), CONSTRAINT "REL_45bdd131d3c34179a7b0f37d15" UNIQUE ("reservation_id"), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_775c9f06fc27ae3ff8fb26f2c4" ON "orders" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_1ce808833b5d40a9b367f783e2" ON "orders" ("payment_expires_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_c884e321f927d5b86aac7c8f9e" ON "orders" ("created_at") `);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('USER', 'ADMIN')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying NOT NULL, "name" character varying, "role" "public"."users_role_enum" NOT NULL DEFAULT 'USER', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" character varying, "action" character varying NOT NULL, "entity_type" character varying NOT NULL, "entity_id" character varying, "details" jsonb, "ip_address" character varying, "user_agent" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_cee5459245f652b75eb2759b4c" ON "audit_logs" ("action") `);
        await queryRunner.query(`CREATE INDEX "IDX_ea9ba3dfb39050f831ee3be40d" ON "audit_logs" ("entity_type") `);
        await queryRunner.query(`CREATE INDEX "IDX_2cd10fda8276bb995288acfbfb" ON "audit_logs" ("created_at") `);
        await queryRunner.query(`ALTER TABLE "reservation_items" ADD CONSTRAINT "FK_77fd31f8972b8cd9165c47443e7" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reservation_items" ADD CONSTRAINT "FK_521df1d94c639b9eb1620ada19d" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reservations" ADD CONSTRAINT "FK_4af5055a871c46d011345a255a6" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_145532db85752b29c57d2b7b1f1" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_9263386c35b6b242540f9493b00" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_a922b820eeef29ac1c6800e826a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_45bdd131d3c34179a7b0f37d15b" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_45bdd131d3c34179a7b0f37d15b"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_a922b820eeef29ac1c6800e826a"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_9263386c35b6b242540f9493b00"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_145532db85752b29c57d2b7b1f1"`);
        await queryRunner.query(`ALTER TABLE "reservations" DROP CONSTRAINT "FK_4af5055a871c46d011345a255a6"`);
        await queryRunner.query(`ALTER TABLE "reservation_items" DROP CONSTRAINT "FK_521df1d94c639b9eb1620ada19d"`);
        await queryRunner.query(`ALTER TABLE "reservation_items" DROP CONSTRAINT "FK_77fd31f8972b8cd9165c47443e7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2cd10fda8276bb995288acfbfb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ea9ba3dfb39050f831ee3be40d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cee5459245f652b75eb2759b4c"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c884e321f927d5b86aac7c8f9e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1ce808833b5d40a9b367f783e2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_775c9f06fc27ae3ff8fb26f2c4"`);
        await queryRunner.query(`DROP TABLE "orders"`);
        await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
        await queryRunner.query(`DROP TABLE "order_items"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_98b848a943fd38687f0caa171a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c42f5dcdd13d6e63ee44b4cb23"`);
        await queryRunner.query(`DROP TABLE "reservations"`);
        await queryRunner.query(`DROP TYPE "public"."reservations_status_enum"`);
        await queryRunner.query(`DROP TABLE "reservation_items"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_995d8194c43edfc98838cabc5a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1afc0a5dc828d56f9e6f361940"`);
        await queryRunner.query(`DROP TABLE "products"`);
    }

}
