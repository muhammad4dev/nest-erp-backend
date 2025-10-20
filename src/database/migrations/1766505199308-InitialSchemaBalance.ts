import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchemaBalance1766505199308 implements MigrationInterface {
  name = 'InitialSchemaBalance1766505199308';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."partners_partner_type_enum" AS ENUM('BUSINESS', 'PERSON')`,
    );
    await queryRunner.query(
      `CREATE TABLE "partners" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL DEFAULT '0', "name" character varying NOT NULL, "email" character varying, "phone" character varying, "partner_type" "public"."partners_partner_type_enum" NOT NULL DEFAULT 'BUSINESS', "is_customer" boolean NOT NULL DEFAULT false, "is_vendor" boolean NOT NULL DEFAULT false, "tax_id" character varying, "address" jsonb, "contact" jsonb, CONSTRAINT "PK_998645b20820e4ab99aeae03b41" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "product_translations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL DEFAULT '0', "product_id" uuid NOT NULL, "locale" character varying(5) NOT NULL, "name" character varying NOT NULL, "description" text, CONSTRAINT "PK_38feaa5884a6a0171d067cc9d15" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "product_categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL DEFAULT '0', "name" character varying NOT NULL, "description" character varying, "code" character varying NOT NULL, "parent_id" uuid, "is_active" boolean NOT NULL DEFAULT true, "sort_order" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_03fac833e3bd77ac88846805305" UNIQUE ("code"), CONSTRAINT "PK_7069dac60d88408eca56fdc9e0c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."product_attributes_type_enum" AS ENUM('TEXT', 'NUMBER', 'BOOLEAN', 'SELECT', 'MULTI_SELECT', 'DATE', 'COLOR')`,
    );
    await queryRunner.query(
      `CREATE TABLE "product_attributes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL DEFAULT '0', "name" character varying NOT NULL, "code" character varying NOT NULL, "type" "public"."product_attributes_type_enum" NOT NULL DEFAULT 'TEXT', "is_required" boolean NOT NULL DEFAULT false, "is_filterable" boolean NOT NULL DEFAULT false, "is_variant" boolean NOT NULL DEFAULT false, "options" jsonb, "sort_order" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_53cb2298b4b230baed465a1a80e" UNIQUE ("code"), CONSTRAINT "PK_4fa18fc5c893cb9894fc40ca921" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "product_attribute_values" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL DEFAULT '0', "product_id" uuid NOT NULL, "attribute_id" uuid NOT NULL, "text_value" text, "number_value" numeric, "boolean_value" boolean, "date_value" date, "selected_options" jsonb, CONSTRAINT "PK_b124baf1272037deac1c21cffe1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_d2e88c5209783f87f0881d6dce" ON "product_attribute_values" ("product_id", "attribute_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "product_variants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL DEFAULT '0', "parent_product_id" uuid NOT NULL, "sku" character varying NOT NULL, "name" character varying, "variant_attributes" jsonb NOT NULL, "sales_price" numeric(14,2), "cost_price" numeric(14,2), "barcode" character varying, "is_active" boolean NOT NULL DEFAULT true, "weight" numeric(10,3), "image_url" text, CONSTRAINT "UQ_46f236f21640f9da218a063a866" UNIQUE ("sku"), CONSTRAINT "PK_281e3f2c55652d6a22c0aa59fd7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_989485293a643d697f347bb1c3" ON "product_variants" ("parent_product_id", "sku") `,
    );
    await queryRunner.query(
      `CREATE TABLE "sales_order_lines" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL DEFAULT '0', "order_id" uuid NOT NULL, "product_id" uuid NOT NULL, "quantity" numeric(12,4) NOT NULL, "unitPrice" numeric(14,2) NOT NULL, "discountRate" numeric(5,2) NOT NULL DEFAULT '0', "subtotal" numeric(14,2) NOT NULL, CONSTRAINT "PK_91a9fd0ffdb8572374cf89df4da" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."sales_orders_status_enum" AS ENUM('DRAFT', 'SENT', 'CONFIRMED', 'INVOICED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "sales_orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL DEFAULT '0', "orderNumber" character varying NOT NULL, "partner_id" uuid NOT NULL, "order_date" date NOT NULL, "status" "public"."sales_orders_status_enum" NOT NULL DEFAULT 'DRAFT', "totalAmount" numeric(14,2) NOT NULL DEFAULT '0', CONSTRAINT "UQ_ea901f7691ec7f314f072d9dee8" UNIQUE ("orderNumber"), CONSTRAINT "PK_5328297e067ca929fbe7cf989dd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "invoice_lines" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL DEFAULT '0', "invoice_id" uuid NOT NULL, "product_id" uuid NOT NULL, "description" character varying, "quantity" numeric(14,4) NOT NULL DEFAULT '1', "unit_price" numeric(14,2) NOT NULL, "discount_amount" numeric(14,2) NOT NULL DEFAULT '0', "discount_rate" numeric(5,2) NOT NULL DEFAULT '0', "tax_amount" numeric(14,2) NOT NULL DEFAULT '0', "line_total" numeric(14,2) NOT NULL DEFAULT '0', CONSTRAINT "PK_3d18eb48142b916f581f0c21a65" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."invoices_type_enum" AS ENUM('INVOICE', 'CREDIT_NOTE', 'DEBIT_NOTE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."invoices_status_enum" AS ENUM('DRAFT', 'SENT', 'PAID', 'CANCELLED', 'RETURNED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "invoices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL DEFAULT '0', "number" character varying NOT NULL, "partner_id" uuid NOT NULL, "sales_order_id" uuid, "original_invoice_id" uuid, "type" "public"."invoices_type_enum" NOT NULL DEFAULT 'INVOICE', "status" "public"."invoices_status_enum" NOT NULL DEFAULT 'DRAFT', "issued_at" TIMESTAMP WITH TIME ZONE, "due_date" date, "eta_uuid" text, "eta_signature" text, "eta_submission_id" text, "total_discount_amount" numeric(14,2) NOT NULL DEFAULT '0', "net_amount" numeric(14,2) NOT NULL DEFAULT '0', "tax_amount" numeric(14,2) NOT NULL DEFAULT '0', "total_amount" numeric(14,2) NOT NULL DEFAULT '0', "notes" text, CONSTRAINT "UQ_6b20aa66f2a835a4f2fbde48724" UNIQUE ("number"), CONSTRAINT "PK_668cef7c22a427fd822cc1be3ce" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0fc50e12fd8f57ab9ed06fc3b7" ON "invoices" ("partner_id", "status") `,
    );
    await queryRunner.query(
      `CREATE TABLE "purchase_order_lines" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL DEFAULT '0', "order_id" uuid NOT NULL, "product_id" uuid NOT NULL, "quantity" numeric(12,4) NOT NULL, "uom_id" uuid, "unitPrice" numeric(14,2) NOT NULL, "subtotal" numeric(14,2) NOT NULL, CONSTRAINT "PK_34a2082d2abb10c5d8713bc19b8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."purchase_orders_status_enum" AS ENUM('RFQ', 'RFQ_SENT', 'TO_APPROVE', 'PURCHASE_ORDER', 'RECEIVED', 'BILLED', 'LOCKED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "purchase_orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL DEFAULT '0', "orderNumber" character varying NOT NULL, "partner_id" uuid NOT NULL, "order_date" date NOT NULL, "status" "public"."purchase_orders_status_enum" NOT NULL DEFAULT 'RFQ', "totalAmount" numeric(14,2) NOT NULL DEFAULT '0', CONSTRAINT "UQ_0a4ef1738b13da938b62393dc04" UNIQUE ("orderNumber"), CONSTRAINT "PK_05148947415204a897e8beb2553" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "vendor_bill_lines" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL DEFAULT '0', "vendor_bill_id" uuid NOT NULL, "product_id" uuid NOT NULL, "description" character varying, "quantity" numeric(14,4) NOT NULL DEFAULT '1', "unit_price" numeric(14,2) NOT NULL, "discount_amount" numeric(14,2) NOT NULL DEFAULT '0', "tax_amount" numeric(14,2) NOT NULL DEFAULT '0', "line_total" numeric(14,2) NOT NULL DEFAULT '0', CONSTRAINT "PK_47a5cb20bfa8e29d7b1c767112b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."vendor_bills_type_enum" AS ENUM('BILL', 'CREDIT_NOTE', 'DEBIT_NOTE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."vendor_bills_status_enum" AS ENUM('DRAFT', 'POSTED', 'PAID', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "vendor_bills" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL DEFAULT '0', "bill_reference" character varying NOT NULL, "partner_id" uuid NOT NULL, "purchase_order_id" uuid, "original_bill_id" uuid, "type" "public"."vendor_bills_type_enum" NOT NULL DEFAULT 'BILL', "status" "public"."vendor_bills_status_enum" NOT NULL DEFAULT 'DRAFT', "received_at" TIMESTAMP WITH TIME ZONE, "due_date" date, "total_discount_amount" numeric(14,2) NOT NULL DEFAULT '0', "net_amount" numeric(14,2) NOT NULL DEFAULT '0', "tax_amount" numeric(14,2) NOT NULL DEFAULT '0', "total_amount" numeric(14,2) NOT NULL DEFAULT '0', "notes" text, CONSTRAINT "PK_7955dfefe45ac3ccb21dbb09318" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f9ad4743f3d57d6d7e64ebd4d7" ON "vendor_bills" ("partner_id", "status") `,
    );
    await queryRunner.query(
      `CREATE TABLE "product_uoms" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL DEFAULT '0', "product_id" uuid NOT NULL, "uom_id" uuid NOT NULL, "conversion_factor" numeric(18,6) NOT NULL DEFAULT '1', "is_purchase_uom" boolean NOT NULL DEFAULT false, "is_sales_uom" boolean NOT NULL DEFAULT false, "barcode" character varying, CONSTRAINT "PK_98089508d30db943243ab750eec" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f8e0e6a165b793a9f20f04ea2f" ON "product_uoms" ("product_id", "uom_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL DEFAULT '0', "user_id" uuid NOT NULL, "token_hash" character varying NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "is_revoked" boolean NOT NULL DEFAULT false, "user_agent" character varying, "ip_address" inet, CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_14187aa4d2d58318c82c62c7ea" ON "refresh_tokens" ("user_id", "is_revoked") `,
    );
    await queryRunner.query(
      `CREATE TABLE "branches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL DEFAULT '0', "name" character varying NOT NULL, "code" character varying NOT NULL, "address" text, "phone" character varying, "email" character varying, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_7f37d3b42defea97f1df0d19535" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_3747df41123cb6ad5b2d50cfd2" ON "branches" ("tenant_id", "code") `,
    );
    await queryRunner.query(
      `CREATE TABLE "employees" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL DEFAULT '0', "code" character varying NOT NULL, "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "email" character varying NOT NULL, "phone" character varying, "job_title" character varying, "department" character varying, "hire_date" date NOT NULL, CONSTRAINT "UQ_2f88c4dff473076e55ca2568d51" UNIQUE ("code"), CONSTRAINT "UQ_765bc1ac8967533a04c74a9f6af" UNIQUE ("email"), CONSTRAINT "PK_b9535a98350d5b26e7eb0c26af4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."employment_contracts_status_enum" AS ENUM('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "employment_contracts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL DEFAULT '0', "employee_id" uuid NOT NULL, "start_date" date NOT NULL, "end_date" date, "wage" numeric(12,2) NOT NULL, "status" "public"."employment_contracts_status_enum" NOT NULL DEFAULT 'DRAFT', "job_position" character varying NOT NULL, CONSTRAINT "PK_15928b5ec88cc7e0b2a6a2ff513" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "partner_balances" ("partner_id" uuid NOT NULL, "account_id" uuid NOT NULL, "tenant_id" uuid NOT NULL, "balance" numeric(18,2) NOT NULL DEFAULT '0', "last_updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), CONSTRAINT "PK_1e18ae1898290e0f14aea688c60" PRIMARY KEY ("partner_id", "account_id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_1e18ae1898290e0f14aea688c6" ON "partner_balances" ("partner_id", "account_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "user_roles" ("user_id" uuid NOT NULL, "role_id" uuid NOT NULL, CONSTRAINT "PK_23ed6f04fe43066df08379fd034" PRIMARY KEY ("user_id", "role_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_87b8888186ca9769c960e92687" ON "user_roles" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b23c65e50a758245a33ee35fda" ON "user_roles" ("role_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" DROP COLUMN "tenantId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" DROP COLUMN "oldData"`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" DROP COLUMN "newData"`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" DROP COLUMN "changedBy"`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" DROP COLUMN "tableName"`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" DROP COLUMN "recordId"`,
    );
    await queryRunner.query(`ALTER TABLE "products" ADD "description" text`);
    await queryRunner.query(`ALTER TABLE "products" ADD "category_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "products" ADD "barcode" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "weight" numeric(10,3)`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "is_active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "is_sellable" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "is_purchasable" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "track_inventory" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "has_variants" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(`ALTER TABLE "products" ADD "image_url" text`);
    await queryRunner.query(`ALTER TABLE "products" ADD "metadata" jsonb`);
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" ADD "tenant_id" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" ADD "table_name" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" ADD "record_id" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" ADD "old_data" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" ADD "new_data" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" ADD "changed_by" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."products_type_enum" RENAME TO "products_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."products_type_enum" AS ENUM('GOODS', 'SERVICE', 'CONSUMABLE', 'DIGITAL')`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ALTER COLUMN "type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ALTER COLUMN "type" TYPE "public"."products_type_enum" USING "type"::"text"::"public"."products_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ALTER COLUMN "type" SET DEFAULT 'GOODS'`,
    );
    await queryRunner.query(`DROP TYPE "public"."products_type_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "products" ALTER COLUMN "salesPrice" TYPE numeric(14,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ALTER COLUMN "costPrice" TYPE numeric(14,2)`,
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
      `ALTER TABLE "user_roles" ADD CONSTRAINT "FK_87b8888186ca9769c960e926870" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD CONSTRAINT "FK_b23c65e50a758245a33ee35fda1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_roles" DROP CONSTRAINT "FK_b23c65e50a758245a33ee35fda1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" DROP CONSTRAINT "FK_87b8888186ca9769c960e926870"`,
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
      `ALTER TABLE "products" ALTER COLUMN "costPrice" TYPE numeric`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ALTER COLUMN "salesPrice" TYPE numeric`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."products_type_enum_old" AS ENUM('GOODS', 'SERVICE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ALTER COLUMN "type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ALTER COLUMN "type" TYPE "public"."products_type_enum_old" USING "type"::"text"::"public"."products_type_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ALTER COLUMN "type" SET DEFAULT 'GOODS'`,
    );
    await queryRunner.query(`DROP TYPE "public"."products_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."products_type_enum_old" RENAME TO "products_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" DROP COLUMN "changed_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" DROP COLUMN "new_data"`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" DROP COLUMN "old_data"`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" DROP COLUMN "record_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" DROP COLUMN "table_name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" DROP COLUMN "tenant_id"`,
    );
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "metadata"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "image_url"`);
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "has_variants"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "track_inventory"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "is_purchasable"`,
    );
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "is_sellable"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "is_active"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "weight"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "barcode"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "category_id"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "description"`);
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" ADD "recordId" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" ADD "tableName" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" ADD "changedBy" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" ADD "newData" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" ADD "oldData" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" ADD "tenantId" uuid NOT NULL`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b23c65e50a758245a33ee35fda"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_87b8888186ca9769c960e92687"`,
    );
    await queryRunner.query(`DROP TABLE "user_roles"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1e18ae1898290e0f14aea688c6"`,
    );
    await queryRunner.query(`DROP TABLE "partner_balances"`);
    await queryRunner.query(`DROP TABLE "employment_contracts"`);
    await queryRunner.query(
      `DROP TYPE "public"."employment_contracts_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE "employees"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3747df41123cb6ad5b2d50cfd2"`,
    );
    await queryRunner.query(`DROP TABLE "branches"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_14187aa4d2d58318c82c62c7ea"`,
    );
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f8e0e6a165b793a9f20f04ea2f"`,
    );
    await queryRunner.query(`DROP TABLE "product_uoms"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f9ad4743f3d57d6d7e64ebd4d7"`,
    );
    await queryRunner.query(`DROP TABLE "vendor_bills"`);
    await queryRunner.query(`DROP TYPE "public"."vendor_bills_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."vendor_bills_type_enum"`);
    await queryRunner.query(`DROP TABLE "vendor_bill_lines"`);
    await queryRunner.query(`DROP TABLE "purchase_orders"`);
    await queryRunner.query(`DROP TYPE "public"."purchase_orders_status_enum"`);
    await queryRunner.query(`DROP TABLE "purchase_order_lines"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0fc50e12fd8f57ab9ed06fc3b7"`,
    );
    await queryRunner.query(`DROP TABLE "invoices"`);
    await queryRunner.query(`DROP TYPE "public"."invoices_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."invoices_type_enum"`);
    await queryRunner.query(`DROP TABLE "invoice_lines"`);
    await queryRunner.query(`DROP TABLE "sales_orders"`);
    await queryRunner.query(`DROP TYPE "public"."sales_orders_status_enum"`);
    await queryRunner.query(`DROP TABLE "sales_order_lines"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_989485293a643d697f347bb1c3"`,
    );
    await queryRunner.query(`DROP TABLE "product_variants"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d2e88c5209783f87f0881d6dce"`,
    );
    await queryRunner.query(`DROP TABLE "product_attribute_values"`);
    await queryRunner.query(`DROP TABLE "product_attributes"`);
    await queryRunner.query(
      `DROP TYPE "public"."product_attributes_type_enum"`,
    );
    await queryRunner.query(`DROP TABLE "product_categories"`);
    await queryRunner.query(`DROP TABLE "product_translations"`);
    await queryRunner.query(`DROP TABLE "partners"`);
    await queryRunner.query(`DROP TYPE "public"."partners_partner_type_enum"`);
  }
}
