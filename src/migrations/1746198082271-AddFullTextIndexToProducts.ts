import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFullTextIndexToProducts implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX product_fulltext_idx
      ON products USING gin (to_tsvector('english', name || ' ' || description || ' ' || category));
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX product_fulltext_idx;
    `);
  }
}