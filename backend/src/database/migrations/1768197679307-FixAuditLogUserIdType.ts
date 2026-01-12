import { MigrationInterface, QueryRunner } from "typeorm";

export class FixAuditLogUserIdType1768197679307 implements MigrationInterface {
    name = 'FixAuditLogUserIdType1768197679307'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD "user_id" uuid`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD "user_id" character varying`);
    }

}
