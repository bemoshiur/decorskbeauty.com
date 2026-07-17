import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_categories_accent" AS ENUM('celadon', 'sky', 'apricot', 'rose-clay', 'lilac');
  CREATE TYPE "public"."enum_products_home_badge" AS ENUM('none', 'bestseller', 'new', 'sale', 'limited');
  CREATE TYPE "public"."enum__products_v_version_home_badge" AS ENUM('none', 'bestseller', 'new', 'sale', 'limited');
  CREATE TYPE "public"."enum_site_settings_footer_socials_platform" AS ENUM('facebook', 'instagram', 'whatsapp', 'youtube', 'tiktok');
  CREATE TYPE "public"."enum_site_settings_footer_payment_methods" AS ENUM('cod', 'bkash', 'nagad', 'rocket', 'upay', 'visa', 'mastercard');
  CREATE TYPE "public"."enum_site_settings_announcement_bar_background" AS ENUM('celadon-deep', 'ink', 'grad');
  CREATE TYPE "public"."enum_homepage_blocks_hero_align" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum_homepage_blocks_hero_theme" AS ENUM('paper', 'cloud', 'mist', 'mesh-hero', 'mesh-mint', 'mesh-bloom', 'ink');
  CREATE TYPE "public"."enum_homepage_blocks_trust_badges_badges_icon" AS ENUM('shield-check', 'badge-check', 'truck', 'rotate-ccw', 'headphones', 'sparkles', 'leaf', 'lock', 'star', 'heart', 'package-check', 'phone');
  CREATE TYPE "public"."enum_homepage_blocks_trust_badges_theme" AS ENUM('paper', 'cloud', 'mist', 'mesh-hero', 'mesh-mint', 'mesh-bloom', 'ink');
  CREATE TYPE "public"."enum_homepage_blocks_featured_products_theme" AS ENUM('paper', 'cloud', 'mist', 'mesh-hero', 'mesh-mint', 'mesh-bloom', 'ink');
  CREATE TYPE "public"."enum_homepage_blocks_category_grid_layout" AS ENUM('bento', 'grid');
  CREATE TYPE "public"."enum_homepage_blocks_category_grid_theme" AS ENUM('paper', 'cloud', 'mist', 'mesh-hero', 'mesh-mint', 'mesh-bloom', 'ink');
  CREATE TYPE "public"."enum_homepage_blocks_promo_banner_layout" AS ENUM('left', 'right', 'full');
  CREATE TYPE "public"."enum_homepage_blocks_promo_banner_theme" AS ENUM('paper', 'cloud', 'mist', 'mesh-hero', 'mesh-mint', 'mesh-bloom', 'ink');
  CREATE TYPE "public"."enum_homepage_blocks_best_sellers_theme" AS ENUM('paper', 'cloud', 'mist', 'mesh-hero', 'mesh-mint', 'mesh-bloom', 'ink');
  CREATE TYPE "public"."enum_homepage_blocks_testimonials_theme" AS ENUM('paper', 'cloud', 'mist', 'mesh-hero', 'mesh-mint', 'mesh-bloom', 'ink');
  CREATE TYPE "public"."enum_homepage_blocks_authenticity_theme" AS ENUM('paper', 'cloud', 'mist', 'mesh-hero', 'mesh-mint', 'mesh-bloom', 'ink');
  CREATE TYPE "public"."enum_homepage_blocks_rich_text_align" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum_homepage_blocks_rich_text_theme" AS ENUM('paper', 'cloud', 'mist', 'mesh-hero', 'mesh-mint', 'mesh-bloom', 'ink');
  CREATE TYPE "public"."enum_homepage_blocks_newsletter_theme" AS ENUM('paper', 'cloud', 'mist', 'mesh-hero', 'mesh-mint', 'mesh-bloom', 'ink');
  CREATE TYPE "public"."enum_homepage_blocks_cta_theme" AS ENUM('paper', 'cloud', 'mist', 'mesh-hero', 'mesh-mint', 'mesh-bloom', 'ink');
  CREATE TABLE "products_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "_products_v_version_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "testimonials" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"location" varchar,
  	"avatar_id" integer,
  	"rating" numeric DEFAULT 5,
  	"quote" varchar NOT NULL,
  	"product_id" integer,
  	"approved" boolean DEFAULT false,
  	"featured" boolean DEFAULT false,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings_announcement_bar_messages" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL,
  	"link_label" varchar,
  	"link_href" varchar
  );
  
  CREATE TABLE "site_settings_header_primary_nav" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_footer_columns_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_footer_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_footer_socials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"platform" "enum_site_settings_footer_socials_platform",
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_footer_payment_methods" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_site_settings_footer_payment_methods",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"announcement_bar_enabled" boolean DEFAULT true,
  	"announcement_bar_background" "enum_site_settings_announcement_bar_background" DEFAULT 'celadon-deep',
  	"header_logo_id" integer,
  	"header_wordmark" varchar DEFAULT 'Decor''s K-Beauty',
  	"header_tagline" varchar DEFAULT '100% authentic Korean skincare',
  	"header_search_placeholder" varchar DEFAULT 'Search skincare, haircare…',
  	"footer_blurb" varchar,
  	"footer_copyright" varchar,
  	"business_identity_site_name" varchar DEFAULT 'Decor''s K-Beauty',
  	"business_identity_phone" varchar DEFAULT '+8801712113032',
  	"business_identity_whatsapp_number" varchar DEFAULT '8801712113032',
  	"business_identity_email" varchar,
  	"business_identity_street_address" varchar DEFAULT 'Flat B5, House 32-34, Road 7, Block C, Banani',
  	"business_identity_locality" varchar DEFAULT 'Dhaka 1212',
  	"business_identity_about_blurb" varchar,
  	"default_seo_meta_title" varchar,
  	"default_seo_meta_description" varchar,
  	"default_seo_og_image_id" integer,
  	"delivery_promise_free_ship_headline" varchar DEFAULT 'Free delivery over ৳4,999',
  	"delivery_promise_zone_blurb" varchar DEFAULT 'Dhaka city, sub-Dhaka & nationwide',
  	"delivery_promise_eta_copy" varchar DEFAULT '2–3 days in Dhaka, 3–5 days nationwide',
  	"product_page_stock_promise" varchar DEFAULT 'In stock · Cash on Delivery · 2–3 days in Dhaka',
  	"product_page_preorder_promise" varchar DEFAULT 'Pre-order · ships in 2–3 weeks · full payment secures your unit',
  	"product_page_authenticity_copy" varchar DEFAULT 'Every unit ships from a tracked import lot with a batch code you can verify.',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "homepage_blocks_hero_floating_badges" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "homepage_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"headline" varchar NOT NULL,
  	"headline_accent" varchar,
  	"subheadline" varchar,
  	"primary_cta_label" varchar,
  	"primary_cta_href" varchar,
  	"secondary_cta_label" varchar,
  	"secondary_cta_href" varchar,
  	"image_id" integer,
  	"align" "enum_homepage_blocks_hero_align" DEFAULT 'left',
  	"theme" "enum_homepage_blocks_hero_theme" DEFAULT 'mesh-hero',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_trust_badges_badges" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" "enum_homepage_blocks_trust_badges_badges_icon" DEFAULT 'shield-check',
  	"label" varchar NOT NULL,
  	"sub" varchar
  );
  
  CREATE TABLE "homepage_blocks_trust_badges" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"theme" "enum_homepage_blocks_trust_badges_theme" DEFAULT 'cloud',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_featured_products" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Featured',
  	"subheading" varchar,
  	"view_all_label" varchar,
  	"view_all_href" varchar,
  	"theme" "enum_homepage_blocks_featured_products_theme" DEFAULT 'paper',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_category_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Shop by category',
  	"subheading" varchar,
  	"layout" "enum_homepage_blocks_category_grid_layout" DEFAULT 'bento',
  	"theme" "enum_homepage_blocks_category_grid_theme" DEFAULT 'mist',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_promo_banner" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar NOT NULL,
  	"body" varchar,
  	"image_id" integer,
  	"cta_label" varchar,
  	"cta_href" varchar,
  	"layout" "enum_homepage_blocks_promo_banner_layout" DEFAULT 'left',
  	"theme" "enum_homepage_blocks_promo_banner_theme" DEFAULT 'mesh-bloom',
  	"start_at" timestamp(3) with time zone,
  	"end_at" timestamp(3) with time zone,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_best_sellers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Best sellers',
  	"subheading" varchar,
  	"theme" "enum_homepage_blocks_best_sellers_theme" DEFAULT 'paper',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_testimonials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Loved in Dhaka',
  	"subheading" varchar,
  	"theme" "enum_homepage_blocks_testimonials_theme" DEFAULT 'mesh-mint',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_authenticity_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_authenticity" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Proof before persuasion',
  	"heading" varchar DEFAULT 'Every unit is verifiably authentic',
  	"body" varchar,
  	"image_id" integer,
  	"verify_cta_label" varchar,
  	"verify_cta_href" varchar,
  	"theme" "enum_homepage_blocks_authenticity_theme" DEFAULT 'ink',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"content" jsonb,
  	"align" "enum_homepage_blocks_rich_text_align" DEFAULT 'center',
  	"theme" "enum_homepage_blocks_rich_text_theme" DEFAULT 'paper',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_newsletter" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Skincare notes, no spam',
  	"subheading" varchar,
  	"placeholder" varchar DEFAULT 'Your phone or email',
  	"cta_label" varchar DEFAULT 'Keep me posted',
  	"theme" "enum_homepage_blocks_newsletter_theme" DEFAULT 'mesh-bloom',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"subheading" varchar,
  	"primary_cta_label" varchar,
  	"primary_cta_href" varchar,
  	"secondary_cta_label" varchar,
  	"secondary_cta_href" varchar,
  	"theme" "enum_homepage_blocks_cta_theme" DEFAULT 'ink',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_og_image_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "homepage_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"products_id" integer,
  	"categories_id" integer
  );
  
  ALTER TABLE "categories" ADD COLUMN "featured_on_home" boolean DEFAULT false;
  ALTER TABLE "categories" ADD COLUMN "home_order" numeric DEFAULT 0;
  ALTER TABLE "categories" ADD COLUMN "tile_image_id" integer;
  ALTER TABLE "categories" ADD COLUMN "accent" "enum_categories_accent" DEFAULT 'celadon';
  ALTER TABLE "products" ADD COLUMN "is_best_seller" boolean DEFAULT false;
  ALTER TABLE "products" ADD COLUMN "is_new" boolean DEFAULT false;
  ALTER TABLE "products" ADD COLUMN "featured_rank" numeric;
  ALTER TABLE "products" ADD COLUMN "home_badge" "enum_products_home_badge" DEFAULT 'none';
  ALTER TABLE "products_rels" ADD COLUMN "products_id" integer;
  ALTER TABLE "_products_v" ADD COLUMN "version_is_best_seller" boolean DEFAULT false;
  ALTER TABLE "_products_v" ADD COLUMN "version_is_new" boolean DEFAULT false;
  ALTER TABLE "_products_v" ADD COLUMN "version_featured_rank" numeric;
  ALTER TABLE "_products_v" ADD COLUMN "version_home_badge" "enum__products_v_version_home_badge" DEFAULT 'none';
  ALTER TABLE "_products_v_rels" ADD COLUMN "products_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "testimonials_id" integer;
  ALTER TABLE "products_highlights" ADD CONSTRAINT "products_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_highlights" ADD CONSTRAINT "_products_v_version_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_avatar_id_media_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings_announcement_bar_messages" ADD CONSTRAINT "site_settings_announcement_bar_messages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_header_primary_nav" ADD CONSTRAINT "site_settings_header_primary_nav_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_footer_columns_links" ADD CONSTRAINT "site_settings_footer_columns_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_footer_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_footer_columns" ADD CONSTRAINT "site_settings_footer_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_footer_socials" ADD CONSTRAINT "site_settings_footer_socials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_footer_payment_methods" ADD CONSTRAINT "site_settings_footer_payment_methods_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_header_logo_id_media_id_fk" FOREIGN KEY ("header_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_default_seo_og_image_id_media_id_fk" FOREIGN KEY ("default_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_hero_floating_badges" ADD CONSTRAINT "homepage_blocks_hero_floating_badges_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_hero" ADD CONSTRAINT "homepage_blocks_hero_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_hero" ADD CONSTRAINT "homepage_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_trust_badges_badges" ADD CONSTRAINT "homepage_blocks_trust_badges_badges_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_trust_badges"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_trust_badges" ADD CONSTRAINT "homepage_blocks_trust_badges_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_featured_products" ADD CONSTRAINT "homepage_blocks_featured_products_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_category_grid" ADD CONSTRAINT "homepage_blocks_category_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_promo_banner" ADD CONSTRAINT "homepage_blocks_promo_banner_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_promo_banner" ADD CONSTRAINT "homepage_blocks_promo_banner_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_best_sellers" ADD CONSTRAINT "homepage_blocks_best_sellers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_testimonials" ADD CONSTRAINT "homepage_blocks_testimonials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_authenticity_points" ADD CONSTRAINT "homepage_blocks_authenticity_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_authenticity"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_authenticity" ADD CONSTRAINT "homepage_blocks_authenticity_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_authenticity" ADD CONSTRAINT "homepage_blocks_authenticity_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_rich_text" ADD CONSTRAINT "homepage_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_newsletter" ADD CONSTRAINT "homepage_blocks_newsletter_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_cta" ADD CONSTRAINT "homepage_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_highlights_order_idx" ON "products_highlights" USING btree ("_order");
  CREATE INDEX "products_highlights_parent_id_idx" ON "products_highlights" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_highlights_order_idx" ON "_products_v_version_highlights" USING btree ("_order");
  CREATE INDEX "_products_v_version_highlights_parent_id_idx" ON "_products_v_version_highlights" USING btree ("_parent_id");
  CREATE INDEX "testimonials_avatar_idx" ON "testimonials" USING btree ("avatar_id");
  CREATE INDEX "testimonials_product_idx" ON "testimonials" USING btree ("product_id");
  CREATE INDEX "testimonials_updated_at_idx" ON "testimonials" USING btree ("updated_at");
  CREATE INDEX "testimonials_created_at_idx" ON "testimonials" USING btree ("created_at");
  CREATE INDEX "site_settings_announcement_bar_messages_order_idx" ON "site_settings_announcement_bar_messages" USING btree ("_order");
  CREATE INDEX "site_settings_announcement_bar_messages_parent_id_idx" ON "site_settings_announcement_bar_messages" USING btree ("_parent_id");
  CREATE INDEX "site_settings_header_primary_nav_order_idx" ON "site_settings_header_primary_nav" USING btree ("_order");
  CREATE INDEX "site_settings_header_primary_nav_parent_id_idx" ON "site_settings_header_primary_nav" USING btree ("_parent_id");
  CREATE INDEX "site_settings_footer_columns_links_order_idx" ON "site_settings_footer_columns_links" USING btree ("_order");
  CREATE INDEX "site_settings_footer_columns_links_parent_id_idx" ON "site_settings_footer_columns_links" USING btree ("_parent_id");
  CREATE INDEX "site_settings_footer_columns_order_idx" ON "site_settings_footer_columns" USING btree ("_order");
  CREATE INDEX "site_settings_footer_columns_parent_id_idx" ON "site_settings_footer_columns" USING btree ("_parent_id");
  CREATE INDEX "site_settings_footer_socials_order_idx" ON "site_settings_footer_socials" USING btree ("_order");
  CREATE INDEX "site_settings_footer_socials_parent_id_idx" ON "site_settings_footer_socials" USING btree ("_parent_id");
  CREATE INDEX "site_settings_footer_payment_methods_order_idx" ON "site_settings_footer_payment_methods" USING btree ("order");
  CREATE INDEX "site_settings_footer_payment_methods_parent_idx" ON "site_settings_footer_payment_methods" USING btree ("parent_id");
  CREATE INDEX "site_settings_header_header_logo_idx" ON "site_settings" USING btree ("header_logo_id");
  CREATE INDEX "site_settings_default_seo_default_seo_og_image_idx" ON "site_settings" USING btree ("default_seo_og_image_id");
  CREATE INDEX "homepage_blocks_hero_floating_badges_order_idx" ON "homepage_blocks_hero_floating_badges" USING btree ("_order");
  CREATE INDEX "homepage_blocks_hero_floating_badges_parent_id_idx" ON "homepage_blocks_hero_floating_badges" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_hero_order_idx" ON "homepage_blocks_hero" USING btree ("_order");
  CREATE INDEX "homepage_blocks_hero_parent_id_idx" ON "homepage_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_hero_path_idx" ON "homepage_blocks_hero" USING btree ("_path");
  CREATE INDEX "homepage_blocks_hero_image_idx" ON "homepage_blocks_hero" USING btree ("image_id");
  CREATE INDEX "homepage_blocks_trust_badges_badges_order_idx" ON "homepage_blocks_trust_badges_badges" USING btree ("_order");
  CREATE INDEX "homepage_blocks_trust_badges_badges_parent_id_idx" ON "homepage_blocks_trust_badges_badges" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_trust_badges_order_idx" ON "homepage_blocks_trust_badges" USING btree ("_order");
  CREATE INDEX "homepage_blocks_trust_badges_parent_id_idx" ON "homepage_blocks_trust_badges" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_trust_badges_path_idx" ON "homepage_blocks_trust_badges" USING btree ("_path");
  CREATE INDEX "homepage_blocks_featured_products_order_idx" ON "homepage_blocks_featured_products" USING btree ("_order");
  CREATE INDEX "homepage_blocks_featured_products_parent_id_idx" ON "homepage_blocks_featured_products" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_featured_products_path_idx" ON "homepage_blocks_featured_products" USING btree ("_path");
  CREATE INDEX "homepage_blocks_category_grid_order_idx" ON "homepage_blocks_category_grid" USING btree ("_order");
  CREATE INDEX "homepage_blocks_category_grid_parent_id_idx" ON "homepage_blocks_category_grid" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_category_grid_path_idx" ON "homepage_blocks_category_grid" USING btree ("_path");
  CREATE INDEX "homepage_blocks_promo_banner_order_idx" ON "homepage_blocks_promo_banner" USING btree ("_order");
  CREATE INDEX "homepage_blocks_promo_banner_parent_id_idx" ON "homepage_blocks_promo_banner" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_promo_banner_path_idx" ON "homepage_blocks_promo_banner" USING btree ("_path");
  CREATE INDEX "homepage_blocks_promo_banner_image_idx" ON "homepage_blocks_promo_banner" USING btree ("image_id");
  CREATE INDEX "homepage_blocks_best_sellers_order_idx" ON "homepage_blocks_best_sellers" USING btree ("_order");
  CREATE INDEX "homepage_blocks_best_sellers_parent_id_idx" ON "homepage_blocks_best_sellers" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_best_sellers_path_idx" ON "homepage_blocks_best_sellers" USING btree ("_path");
  CREATE INDEX "homepage_blocks_testimonials_order_idx" ON "homepage_blocks_testimonials" USING btree ("_order");
  CREATE INDEX "homepage_blocks_testimonials_parent_id_idx" ON "homepage_blocks_testimonials" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_testimonials_path_idx" ON "homepage_blocks_testimonials" USING btree ("_path");
  CREATE INDEX "homepage_blocks_authenticity_points_order_idx" ON "homepage_blocks_authenticity_points" USING btree ("_order");
  CREATE INDEX "homepage_blocks_authenticity_points_parent_id_idx" ON "homepage_blocks_authenticity_points" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_authenticity_order_idx" ON "homepage_blocks_authenticity" USING btree ("_order");
  CREATE INDEX "homepage_blocks_authenticity_parent_id_idx" ON "homepage_blocks_authenticity" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_authenticity_path_idx" ON "homepage_blocks_authenticity" USING btree ("_path");
  CREATE INDEX "homepage_blocks_authenticity_image_idx" ON "homepage_blocks_authenticity" USING btree ("image_id");
  CREATE INDEX "homepage_blocks_rich_text_order_idx" ON "homepage_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "homepage_blocks_rich_text_parent_id_idx" ON "homepage_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_rich_text_path_idx" ON "homepage_blocks_rich_text" USING btree ("_path");
  CREATE INDEX "homepage_blocks_newsletter_order_idx" ON "homepage_blocks_newsletter" USING btree ("_order");
  CREATE INDEX "homepage_blocks_newsletter_parent_id_idx" ON "homepage_blocks_newsletter" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_newsletter_path_idx" ON "homepage_blocks_newsletter" USING btree ("_path");
  CREATE INDEX "homepage_blocks_cta_order_idx" ON "homepage_blocks_cta" USING btree ("_order");
  CREATE INDEX "homepage_blocks_cta_parent_id_idx" ON "homepage_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_cta_path_idx" ON "homepage_blocks_cta" USING btree ("_path");
  CREATE INDEX "homepage_seo_seo_og_image_idx" ON "homepage" USING btree ("seo_og_image_id");
  CREATE INDEX "homepage_rels_order_idx" ON "homepage_rels" USING btree ("order");
  CREATE INDEX "homepage_rels_parent_idx" ON "homepage_rels" USING btree ("parent_id");
  CREATE INDEX "homepage_rels_path_idx" ON "homepage_rels" USING btree ("path");
  CREATE INDEX "homepage_rels_products_id_idx" ON "homepage_rels" USING btree ("products_id");
  CREATE INDEX "homepage_rels_categories_id_idx" ON "homepage_rels" USING btree ("categories_id");
  ALTER TABLE "categories" ADD CONSTRAINT "categories_tile_image_id_media_id_fk" FOREIGN KEY ("tile_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "categories_tile_image_idx" ON "categories" USING btree ("tile_image_id");
  CREATE INDEX "products_rels_products_id_idx" ON "products_rels" USING btree ("products_id");
  CREATE INDEX "_products_v_rels_products_id_idx" ON "_products_v_rels" USING btree ("products_id");
  CREATE INDEX "payload_locked_documents_rels_testimonials_id_idx" ON "payload_locked_documents_rels" USING btree ("testimonials_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products_highlights" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_products_v_version_highlights" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "testimonials" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_announcement_bar_messages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_header_primary_nav" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_footer_columns_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_footer_columns" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_footer_socials" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_footer_payment_methods" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_hero_floating_badges" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_trust_badges_badges" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_trust_badges" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_featured_products" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_category_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_promo_banner" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_best_sellers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_testimonials" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_authenticity_points" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_authenticity" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_rich_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_newsletter" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_cta" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "products_highlights" CASCADE;
  DROP TABLE "_products_v_version_highlights" CASCADE;
  DROP TABLE "testimonials" CASCADE;
  DROP TABLE "site_settings_announcement_bar_messages" CASCADE;
  DROP TABLE "site_settings_header_primary_nav" CASCADE;
  DROP TABLE "site_settings_footer_columns_links" CASCADE;
  DROP TABLE "site_settings_footer_columns" CASCADE;
  DROP TABLE "site_settings_footer_socials" CASCADE;
  DROP TABLE "site_settings_footer_payment_methods" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "homepage_blocks_hero_floating_badges" CASCADE;
  DROP TABLE "homepage_blocks_hero" CASCADE;
  DROP TABLE "homepage_blocks_trust_badges_badges" CASCADE;
  DROP TABLE "homepage_blocks_trust_badges" CASCADE;
  DROP TABLE "homepage_blocks_featured_products" CASCADE;
  DROP TABLE "homepage_blocks_category_grid" CASCADE;
  DROP TABLE "homepage_blocks_promo_banner" CASCADE;
  DROP TABLE "homepage_blocks_best_sellers" CASCADE;
  DROP TABLE "homepage_blocks_testimonials" CASCADE;
  DROP TABLE "homepage_blocks_authenticity_points" CASCADE;
  DROP TABLE "homepage_blocks_authenticity" CASCADE;
  DROP TABLE "homepage_blocks_rich_text" CASCADE;
  DROP TABLE "homepage_blocks_newsletter" CASCADE;
  DROP TABLE "homepage_blocks_cta" CASCADE;
  DROP TABLE "homepage" CASCADE;
  DROP TABLE "homepage_rels" CASCADE;
  ALTER TABLE "categories" DROP CONSTRAINT "categories_tile_image_id_media_id_fk";
  
  ALTER TABLE "products_rels" DROP CONSTRAINT "products_rels_products_fk";
  
  ALTER TABLE "_products_v_rels" DROP CONSTRAINT "_products_v_rels_products_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_testimonials_fk";
  
  DROP INDEX "categories_tile_image_idx";
  DROP INDEX "products_rels_products_id_idx";
  DROP INDEX "_products_v_rels_products_id_idx";
  DROP INDEX "payload_locked_documents_rels_testimonials_id_idx";
  ALTER TABLE "categories" DROP COLUMN "featured_on_home";
  ALTER TABLE "categories" DROP COLUMN "home_order";
  ALTER TABLE "categories" DROP COLUMN "tile_image_id";
  ALTER TABLE "categories" DROP COLUMN "accent";
  ALTER TABLE "products" DROP COLUMN "is_best_seller";
  ALTER TABLE "products" DROP COLUMN "is_new";
  ALTER TABLE "products" DROP COLUMN "featured_rank";
  ALTER TABLE "products" DROP COLUMN "home_badge";
  ALTER TABLE "products_rels" DROP COLUMN "products_id";
  ALTER TABLE "_products_v" DROP COLUMN "version_is_best_seller";
  ALTER TABLE "_products_v" DROP COLUMN "version_is_new";
  ALTER TABLE "_products_v" DROP COLUMN "version_featured_rank";
  ALTER TABLE "_products_v" DROP COLUMN "version_home_badge";
  ALTER TABLE "_products_v_rels" DROP COLUMN "products_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "testimonials_id";
  DROP TYPE "public"."enum_categories_accent";
  DROP TYPE "public"."enum_products_home_badge";
  DROP TYPE "public"."enum__products_v_version_home_badge";
  DROP TYPE "public"."enum_site_settings_footer_socials_platform";
  DROP TYPE "public"."enum_site_settings_footer_payment_methods";
  DROP TYPE "public"."enum_site_settings_announcement_bar_background";
  DROP TYPE "public"."enum_homepage_blocks_hero_align";
  DROP TYPE "public"."enum_homepage_blocks_hero_theme";
  DROP TYPE "public"."enum_homepage_blocks_trust_badges_badges_icon";
  DROP TYPE "public"."enum_homepage_blocks_trust_badges_theme";
  DROP TYPE "public"."enum_homepage_blocks_featured_products_theme";
  DROP TYPE "public"."enum_homepage_blocks_category_grid_layout";
  DROP TYPE "public"."enum_homepage_blocks_category_grid_theme";
  DROP TYPE "public"."enum_homepage_blocks_promo_banner_layout";
  DROP TYPE "public"."enum_homepage_blocks_promo_banner_theme";
  DROP TYPE "public"."enum_homepage_blocks_best_sellers_theme";
  DROP TYPE "public"."enum_homepage_blocks_testimonials_theme";
  DROP TYPE "public"."enum_homepage_blocks_authenticity_theme";
  DROP TYPE "public"."enum_homepage_blocks_rich_text_align";
  DROP TYPE "public"."enum_homepage_blocks_rich_text_theme";
  DROP TYPE "public"."enum_homepage_blocks_newsletter_theme";
  DROP TYPE "public"."enum_homepage_blocks_cta_theme";`)
}
