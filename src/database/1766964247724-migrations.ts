import { MigrationInterface, QueryRunner } from 'typeorm';
import { ensureUuidV7Defaults } from './migrations/utils/ensure-uuidv7-defaults';

export class Migrations1766964247724 implements MigrationInterface {
  name = 'Migrations1766964247724';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" DROP COLUMN "newData"`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" DROP COLUMN "changedBy"`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" DROP COLUMN "oldData"`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" DROP COLUMN "tableName"`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" DROP COLUMN "recordId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" DROP COLUMN "tenantId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP CONSTRAINT "FK_342dc9d572d3dbddaf4ea858900"`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_balances" DROP CONSTRAINT "FK_23281e6eb6dd4a0ff73093e205f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" DROP CONSTRAINT "FK_ac65643522552319a771ecce307"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_orders" DROP CONSTRAINT "FK_3a290763107b4d320300c19d2d6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_bills" DROP CONSTRAINT "FK_f17533311a367b3246dc776332e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "partners" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "partners" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "uom_units" DROP CONSTRAINT "FK_7c154f7de8e0184b1935bf1d0d6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "uom_categories" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "uom_categories" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_uoms" DROP CONSTRAINT "FK_20ecc06518e9bf1475bcd89b460"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_d3d435a1fbb494a6f4588144f8d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_order_lines" DROP CONSTRAINT "FK_4fb6a0c0a6ef47cc5360a0a8627"`,
    );
    await queryRunner.query(
      `ALTER TABLE "uom_units" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "uom_units" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_translations" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_translations" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_categories" DROP CONSTRAINT "FK_5f151d414daab0290f65b517ed4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_9a5f6868c96e0069e699f33e124"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_categories" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_categories" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_attribute_values" DROP CONSTRAINT "FK_f1f04534a41f575a6def0710063"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_attributes" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_attributes" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_attribute_values" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_attribute_values" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_lines" DROP CONSTRAINT "FK_975593df931842435a9c6979c55"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_attribute_values" DROP CONSTRAINT "FK_61655fe2f6d179eced519392ced"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_translations" DROP CONSTRAINT "FK_1b7b07c6049367c6446c5ac5605"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_uoms" DROP CONSTRAINT "FK_55de210dafe531da86d4806f5e4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" DROP CONSTRAINT "FK_eee12d6ca221e41fde8313c301c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_order_lines" DROP CONSTRAINT "FK_1b7242d654272b67cfffcd9d6ea"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_order_lines" DROP CONSTRAINT "FK_94351a987335d4452480d5ddf06"`,
    );
    await queryRunner.query(
      `ALTER TABLE "stock_quants" DROP CONSTRAINT "FK_8a601c40d169717af6c300f6d59"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_bill_lines" DROP CONSTRAINT "FK_6cc8a2ede985f28b3b487fbd69f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_order_lines" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_order_lines" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP CONSTRAINT "FK_212bea3f86e07d6f487678a989f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_order_lines" DROP CONSTRAINT "FK_bea838805b97e16d358a3e11c5e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_orders" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_orders" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_lines" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_lines" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP CONSTRAINT "FK_e6a401ec68848324482095732b8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_bills" DROP CONSTRAINT "FK_e5b150145e8d179ef7f1a2eaed6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_terms" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_terms" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_lines" DROP CONSTRAINT "FK_2da95dc86a54a00ff20ce46d0fe"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP CONSTRAINT "FK_d62030b9ec51c654fb037d4cc26"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_order_lines" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_order_lines" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_order_lines" DROP CONSTRAINT "FK_6d450e4816970bce04843945015"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_bills" DROP CONSTRAINT "FK_2b958cca5b003473ea3272280d3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_bill_lines" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_bill_lines" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_bill_lines" DROP CONSTRAINT "FK_0c9b1ffc9f138d2c8b9b0c6a63a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_bills" DROP CONSTRAINT "FK_76f4f7136c9893a93da8b875211"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_bills" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_bills" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "locations" DROP CONSTRAINT "FK_06f770dfdf4e78f67ad08f80cdc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "stock_quants" DROP CONSTRAINT "FK_1b6e204204ba2d295ef8ed14fd2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "locations" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "locations" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "stock_quants" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "stock_quants" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_uoms" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_uoms" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_17022daf3f885f7d35423e9971e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "permissions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "permissions" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_178199805b901ccd220ab7740ec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" DROP CONSTRAINT "FK_b23c65e50a758245a33ee35fda1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" DROP CONSTRAINT "FK_87b8888186ca9769c960e926870"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "employment_contracts" DROP CONSTRAINT "FK_3a6fc0765b6b1a6676a3e0bf63c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employees" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "employees" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "employment_contracts" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "employment_contracts" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_lines" DROP CONSTRAINT "FK_46bed88ea929e6f0aa17bf20845"`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_balances" DROP CONSTRAINT "FK_90e5d58cf755e0943a194cd5dca"`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_lines" DROP CONSTRAINT "FK_1fd23ae91f0c24764b4e581c72e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_entries" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_entries" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_lines" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_lines" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "fiscal_periods" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "fiscal_periods" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "uom_units" ADD CONSTRAINT "FK_7c154f7de8e0184b1935bf1d0d6" FOREIGN KEY ("category_id") REFERENCES "uom_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_translations" ADD CONSTRAINT "FK_1b7b07c6049367c6446c5ac5605" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_categories" ADD CONSTRAINT "FK_5f151d414daab0290f65b517ed4" FOREIGN KEY ("parent_id") REFERENCES "product_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_attribute_values" ADD CONSTRAINT "FK_61655fe2f6d179eced519392ced" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_attribute_values" ADD CONSTRAINT "FK_f1f04534a41f575a6def0710063" FOREIGN KEY ("attribute_id") REFERENCES "product_attributes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" ADD CONSTRAINT "FK_eee12d6ca221e41fde8313c301c" FOREIGN KEY ("parent_product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_9a5f6868c96e0069e699f33e124" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_d3d435a1fbb494a6f4588144f8d" FOREIGN KEY ("uom_id") REFERENCES "uom_units"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_order_lines" ADD CONSTRAINT "FK_bea838805b97e16d358a3e11c5e" FOREIGN KEY ("order_id") REFERENCES "sales_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_order_lines" ADD CONSTRAINT "FK_94351a987335d4452480d5ddf06" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_orders" ADD CONSTRAINT "FK_3a290763107b4d320300c19d2d6" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_lines" ADD CONSTRAINT "FK_2da95dc86a54a00ff20ce46d0fe" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_lines" ADD CONSTRAINT "FK_975593df931842435a9c6979c55" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD CONSTRAINT "FK_342dc9d572d3dbddaf4ea858900" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD CONSTRAINT "FK_212bea3f86e07d6f487678a989f" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD CONSTRAINT "FK_d62030b9ec51c654fb037d4cc26" FOREIGN KEY ("original_invoice_id") REFERENCES "invoices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD CONSTRAINT "FK_e6a401ec68848324482095732b8" FOREIGN KEY ("payment_term_id") REFERENCES "payment_terms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "FK_6d450e4816970bce04843945015" FOREIGN KEY ("order_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "FK_1b7242d654272b67cfffcd9d6ea" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "FK_4fb6a0c0a6ef47cc5360a0a8627" FOREIGN KEY ("uom_id") REFERENCES "uom_units"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" ADD CONSTRAINT "FK_ac65643522552319a771ecce307" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_bill_lines" ADD CONSTRAINT "FK_0c9b1ffc9f138d2c8b9b0c6a63a" FOREIGN KEY ("vendor_bill_id") REFERENCES "vendor_bills"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_bill_lines" ADD CONSTRAINT "FK_6cc8a2ede985f28b3b487fbd69f" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_bills" ADD CONSTRAINT "FK_f17533311a367b3246dc776332e" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_bills" ADD CONSTRAINT "FK_2b958cca5b003473ea3272280d3" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_bills" ADD CONSTRAINT "FK_76f4f7136c9893a93da8b875211" FOREIGN KEY ("original_bill_id") REFERENCES "vendor_bills"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_bills" ADD CONSTRAINT "FK_e5b150145e8d179ef7f1a2eaed6" FOREIGN KEY ("payment_term_id") REFERENCES "payment_terms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "locations" ADD CONSTRAINT "FK_06f770dfdf4e78f67ad08f80cdc" FOREIGN KEY ("parent_location_id") REFERENCES "locations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "stock_quants" ADD CONSTRAINT "FK_8a601c40d169717af6c300f6d59" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "stock_quants" ADD CONSTRAINT "FK_1b6e204204ba2d295ef8ed14fd2" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_uoms" ADD CONSTRAINT "FK_55de210dafe531da86d4806f5e4" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_uoms" ADD CONSTRAINT "FK_20ecc06518e9bf1475bcd89b460" FOREIGN KEY ("uom_id") REFERENCES "uom_units"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employment_contracts" ADD CONSTRAINT "FK_3a6fc0765b6b1a6676a3e0bf63c" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_balances" ADD CONSTRAINT "FK_23281e6eb6dd4a0ff73093e205f" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_balances" ADD CONSTRAINT "FK_90e5d58cf755e0943a194cd5dca" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_lines" ADD CONSTRAINT "FK_1fd23ae91f0c24764b4e581c72e" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_lines" ADD CONSTRAINT "FK_46bed88ea929e6f0aa17bf20845" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_178199805b901ccd220ab7740ec" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_17022daf3f885f7d35423e9971e" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD CONSTRAINT "FK_87b8888186ca9769c960e926870" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD CONSTRAINT "FK_b23c65e50a758245a33ee35fda1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );

    // Upgrade all UUID defaults to v7 (or just the new table)
    await ensureUuidV7Defaults(queryRunner); // All tables
    // OR: await ensureUuidV7Defaults(queryRunner, 'new_feature_table'); // Specific table
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_roles" DROP CONSTRAINT "FK_b23c65e50a758245a33ee35fda1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" DROP CONSTRAINT "FK_87b8888186ca9769c960e926870"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_17022daf3f885f7d35423e9971e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_178199805b901ccd220ab7740ec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_lines" DROP CONSTRAINT "FK_46bed88ea929e6f0aa17bf20845"`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_lines" DROP CONSTRAINT "FK_1fd23ae91f0c24764b4e581c72e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_balances" DROP CONSTRAINT "FK_90e5d58cf755e0943a194cd5dca"`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_balances" DROP CONSTRAINT "FK_23281e6eb6dd4a0ff73093e205f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employment_contracts" DROP CONSTRAINT "FK_3a6fc0765b6b1a6676a3e0bf63c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_uoms" DROP CONSTRAINT "FK_20ecc06518e9bf1475bcd89b460"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_uoms" DROP CONSTRAINT "FK_55de210dafe531da86d4806f5e4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "stock_quants" DROP CONSTRAINT "FK_1b6e204204ba2d295ef8ed14fd2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "stock_quants" DROP CONSTRAINT "FK_8a601c40d169717af6c300f6d59"`,
    );
    await queryRunner.query(
      `ALTER TABLE "locations" DROP CONSTRAINT "FK_06f770dfdf4e78f67ad08f80cdc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_bills" DROP CONSTRAINT "FK_e5b150145e8d179ef7f1a2eaed6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_bills" DROP CONSTRAINT "FK_76f4f7136c9893a93da8b875211"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_bills" DROP CONSTRAINT "FK_2b958cca5b003473ea3272280d3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_bills" DROP CONSTRAINT "FK_f17533311a367b3246dc776332e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_bill_lines" DROP CONSTRAINT "FK_6cc8a2ede985f28b3b487fbd69f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_bill_lines" DROP CONSTRAINT "FK_0c9b1ffc9f138d2c8b9b0c6a63a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" DROP CONSTRAINT "FK_ac65643522552319a771ecce307"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_order_lines" DROP CONSTRAINT "FK_4fb6a0c0a6ef47cc5360a0a8627"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_order_lines" DROP CONSTRAINT "FK_1b7242d654272b67cfffcd9d6ea"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_order_lines" DROP CONSTRAINT "FK_6d450e4816970bce04843945015"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP CONSTRAINT "FK_e6a401ec68848324482095732b8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP CONSTRAINT "FK_d62030b9ec51c654fb037d4cc26"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP CONSTRAINT "FK_212bea3f86e07d6f487678a989f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP CONSTRAINT "FK_342dc9d572d3dbddaf4ea858900"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_lines" DROP CONSTRAINT "FK_975593df931842435a9c6979c55"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_lines" DROP CONSTRAINT "FK_2da95dc86a54a00ff20ce46d0fe"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_orders" DROP CONSTRAINT "FK_3a290763107b4d320300c19d2d6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_order_lines" DROP CONSTRAINT "FK_94351a987335d4452480d5ddf06"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_order_lines" DROP CONSTRAINT "FK_bea838805b97e16d358a3e11c5e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_d3d435a1fbb494a6f4588144f8d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_9a5f6868c96e0069e699f33e124"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" DROP CONSTRAINT "FK_eee12d6ca221e41fde8313c301c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_attribute_values" DROP CONSTRAINT "FK_f1f04534a41f575a6def0710063"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_attribute_values" DROP CONSTRAINT "FK_61655fe2f6d179eced519392ced"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_categories" DROP CONSTRAINT "FK_5f151d414daab0290f65b517ed4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_translations" DROP CONSTRAINT "FK_1b7b07c6049367c6446c5ac5605"`,
    );
    await queryRunner.query(
      `ALTER TABLE "uom_units" DROP CONSTRAINT "FK_7c154f7de8e0184b1935bf1d0d6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fiscal_periods" ALTER COLUMN "id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "fiscal_periods" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_lines" ALTER COLUMN "id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_lines" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_entries" ALTER COLUMN "id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_entries" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_lines" ADD CONSTRAINT "FK_1fd23ae91f0c24764b4e581c72e" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" ALTER COLUMN "id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_balances" ADD CONSTRAINT "FK_90e5d58cf755e0943a194cd5dca" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_lines" ADD CONSTRAINT "FK_46bed88ea929e6f0aa17bf20845" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employment_contracts" ALTER COLUMN "id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "employment_contracts" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "employees" ALTER COLUMN "id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "employees" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "employment_contracts" ADD CONSTRAINT "FK_3a6fc0765b6b1a6676a3e0bf63c" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" ALTER COLUMN "id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" ALTER COLUMN "id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ALTER COLUMN "id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" ALTER COLUMN "id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD CONSTRAINT "FK_87b8888186ca9769c960e926870" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ALTER COLUMN "id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD CONSTRAINT "FK_b23c65e50a758245a33ee35fda1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_178199805b901ccd220ab7740ec" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "permissions" ALTER COLUMN "id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "permissions" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_17022daf3f885f7d35423e9971e" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_uoms" ALTER COLUMN "id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_uoms" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "stock_quants" ALTER COLUMN "id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "stock_quants" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "locations" ALTER COLUMN "id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "locations" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "stock_quants" ADD CONSTRAINT "FK_1b6e204204ba2d295ef8ed14fd2" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "locations" ADD CONSTRAINT "FK_06f770dfdf4e78f67ad08f80cdc" FOREIGN KEY ("parent_location_id") REFERENCES "locations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_bills" ALTER COLUMN "id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_bills" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_bills" ADD CONSTRAINT "FK_76f4f7136c9893a93da8b875211" FOREIGN KEY ("original_bill_id") REFERENCES "vendor_bills"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_bill_lines" ADD CONSTRAINT "FK_0c9b1ffc9f138d2c8b9b0c6a63a" FOREIGN KEY ("vendor_bill_id") REFERENCES "vendor_bills"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_bill_lines" ALTER COLUMN "id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_bill_lines" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" ALTER COLUMN "id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_bills" ADD CONSTRAINT "FK_2b958cca5b003473ea3272280d3" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "FK_6d450e4816970bce04843945015" FOREIGN KEY ("order_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_order_lines" ALTER COLUMN "id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_order_lines" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD CONSTRAINT "FK_d62030b9ec51c654fb037d4cc26" FOREIGN KEY ("original_invoice_id") REFERENCES "invoices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_lines" ADD CONSTRAINT "FK_2da95dc86a54a00ff20ce46d0fe" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_terms" ALTER COLUMN "id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_terms" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_bills" ADD CONSTRAINT "FK_e5b150145e8d179ef7f1a2eaed6" FOREIGN KEY ("payment_term_id") REFERENCES "payment_terms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD CONSTRAINT "FK_e6a401ec68848324482095732b8" FOREIGN KEY ("payment_term_id") REFERENCES "payment_terms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_lines" ALTER COLUMN "id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_lines" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_orders" ALTER COLUMN "id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_orders" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_order_lines" ADD CONSTRAINT "FK_bea838805b97e16d358a3e11c5e" FOREIGN KEY ("order_id") REFERENCES "sales_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD CONSTRAINT "FK_212bea3f86e07d6f487678a989f" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_order_lines" ALTER COLUMN "id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_order_lines" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ALTER COLUMN "id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_bill_lines" ADD CONSTRAINT "FK_6cc8a2ede985f28b3b487fbd69f" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "stock_quants" ADD CONSTRAINT "FK_8a601c40d169717af6c300f6d59" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_order_lines" ADD CONSTRAINT "FK_94351a987335d4452480d5ddf06" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "FK_1b7242d654272b67cfffcd9d6ea" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" ADD CONSTRAINT "FK_eee12d6ca221e41fde8313c301c" FOREIGN KEY ("parent_product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_uoms" ADD CONSTRAINT "FK_55de210dafe531da86d4806f5e4" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_translations" ADD CONSTRAINT "FK_1b7b07c6049367c6446c5ac5605" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_attribute_values" ADD CONSTRAINT "FK_61655fe2f6d179eced519392ced" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_lines" ADD CONSTRAINT "FK_975593df931842435a9c6979c55" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" ALTER COLUMN "id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_attribute_values" ALTER COLUMN "id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_attribute_values" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_attributes" ALTER COLUMN "id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_attributes" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_attribute_values" ADD CONSTRAINT "FK_f1f04534a41f575a6def0710063" FOREIGN KEY ("attribute_id") REFERENCES "product_attributes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_categories" ALTER COLUMN "id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_categories" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_9a5f6868c96e0069e699f33e124" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_categories" ADD CONSTRAINT "FK_5f151d414daab0290f65b517ed4" FOREIGN KEY ("parent_id") REFERENCES "product_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_translations" ALTER COLUMN "id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_translations" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "uom_units" ALTER COLUMN "id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "uom_units" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "FK_4fb6a0c0a6ef47cc5360a0a8627" FOREIGN KEY ("uom_id") REFERENCES "uom_units"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_d3d435a1fbb494a6f4588144f8d" FOREIGN KEY ("uom_id") REFERENCES "uom_units"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_uoms" ADD CONSTRAINT "FK_20ecc06518e9bf1475bcd89b460" FOREIGN KEY ("uom_id") REFERENCES "uom_units"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "uom_categories" ALTER COLUMN "id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "uom_categories" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "uom_units" ADD CONSTRAINT "FK_7c154f7de8e0184b1935bf1d0d6" FOREIGN KEY ("category_id") REFERENCES "uom_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "partners" ALTER COLUMN "id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "partners" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_bills" ADD CONSTRAINT "FK_f17533311a367b3246dc776332e" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_orders" ADD CONSTRAINT "FK_3a290763107b4d320300c19d2d6" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" ADD CONSTRAINT "FK_ac65643522552319a771ecce307" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_balances" ADD CONSTRAINT "FK_23281e6eb6dd4a0ff73093e205f" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD CONSTRAINT "FK_342dc9d572d3dbddaf4ea858900" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" ADD "tenantId" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" ADD "recordId" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" ADD "tableName" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" ADD "oldData" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" ADD "changedBy" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" ADD "newData" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
  }
}
