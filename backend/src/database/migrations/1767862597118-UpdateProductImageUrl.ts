import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateProductImageUrl1767862597118 implements MigrationInterface {
    name = 'UpdateProductImageUrl1767862597118'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "image_url"`);
        await queryRunner.query(`ALTER TABLE "products" ADD "image_url" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "image_url"`);
        await queryRunner.query(`ALTER TABLE "products" ADD "image_url" integer`);
    }

}
