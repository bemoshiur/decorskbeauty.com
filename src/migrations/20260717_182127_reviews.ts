import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_reviews_status" AS ENUM('pending', 'approved', 'rejected');
  CREATE TABLE "reviews" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"product_id" integer NOT NULL,
  	"rating" numeric NOT NULL,
  	"title" varchar,
  	"body" varchar NOT NULL,
  	"author_name" varchar NOT NULL,
  	"author_phone" varchar,
  	"author_ip" varchar,
  	"status" "enum_reviews_status" DEFAULT 'pending' NOT NULL,
  	"verified_purchase" boolean DEFAULT false,
  	"admin_note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "reviews_id" integer;
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "reviews_product_idx" ON "reviews" USING btree ("product_id");
  CREATE INDEX "reviews_status_idx" ON "reviews" USING btree ("status");
  CREATE INDEX "reviews_updated_at_idx" ON "reviews" USING btree ("updated_at");
  CREATE INDEX "reviews_created_at_idx" ON "reviews" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reviews_fk" FOREIGN KEY ("reviews_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_reviews_id_idx" ON "payload_locked_documents_rels" USING btree ("reviews_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "reviews" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "reviews" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_reviews_fk";
  
  DROP INDEX "payload_locked_documents_rels_reviews_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "reviews_id";
  DROP TYPE "public"."enum_reviews_status";`)
}
