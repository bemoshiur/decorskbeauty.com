import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_roles" AS ENUM('owner', 'manager', 'inventory', 'packer', 'accounts', 'support');
  CREATE TYPE "public"."enum_products_skin_types" AS ENUM('dry', 'oily', 'combination', 'sensitive', 'normal', 'acneProne');
  CREATE TYPE "public"."enum_products_concerns" AS ENUM('acne', 'pigmentation', 'dullness', 'aging', 'pores', 'redness', 'hairfall', 'dandruff', 'frizz');
  CREATE TYPE "public"."enum_products_product_type" AS ENUM('cleanser', 'toner', 'essence', 'serum', 'ampoule', 'moisturizer', 'sunscreen', 'mask', 'exfoliator', 'eyeCream', 'shampoo', 'conditioner', 'hairTreatment', 'tool', 'set');
  CREATE TYPE "public"."enum_products_fulfilment_mode" AS ENUM('readyStock', 'preOrder', 'both');
  CREATE TYPE "public"."enum_products_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__products_v_version_skin_types" AS ENUM('dry', 'oily', 'combination', 'sensitive', 'normal', 'acneProne');
  CREATE TYPE "public"."enum__products_v_version_concerns" AS ENUM('acne', 'pigmentation', 'dullness', 'aging', 'pores', 'redness', 'hairfall', 'dandruff', 'frizz');
  CREATE TYPE "public"."enum__products_v_version_product_type" AS ENUM('cleanser', 'toner', 'essence', 'serum', 'ampoule', 'moisturizer', 'sunscreen', 'mask', 'exfoliator', 'eyeCream', 'shampoo', 'conditioner', 'hairTreatment', 'tool', 'set');
  CREATE TYPE "public"."enum__products_v_version_fulfilment_mode" AS ENUM('readyStock', 'preOrder', 'both');
  CREATE TYPE "public"."enum__products_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_suppliers_default_currency" AS ENUM('KRW', 'USD');
  CREATE TYPE "public"."enum_purchase_orders_currency" AS ENUM('KRW', 'USD');
  CREATE TYPE "public"."enum_purchase_orders_allocation_basis" AS ENUM('byValue', 'byWeight', 'byQty');
  CREATE TYPE "public"."enum_purchase_orders_status" AS ENUM('draft', 'ordered', 'inTransit', 'customs', 'received', 'closed');
  CREATE TYPE "public"."enum_stock_lots_status" AS ENUM('open', 'depleted', 'quarantined', 'expired');
  CREATE TYPE "public"."enum_stock_movements_type" AS ENUM('receipt', 'reserve', 'release', 'ship', 'returnRestock', 'damage', 'adjustment', 'expiryWriteoff');
  CREATE TYPE "public"."enum_customers_addresses_zone" AS ENUM('dhakaCity', 'dhakaSub', 'outside');
  CREATE TYPE "public"."enum_orders_risk_flags" AS ENUM('newCustomer', 'highValue', 'repeatCanceller', 'addressMismatch', 'inAppBrowser');
  CREATE TYPE "public"."enum_orders_channel" AS ENUM('web', 'facebook', 'phone', 'walkIn');
  CREATE TYPE "public"."enum_orders_order_type" AS ENUM('ready', 'preorder', 'mixed');
  CREATE TYPE "public"."enum_orders_payment_method" AS ENUM('cod', 'epsFull', 'epsAdvance');
  CREATE TYPE "public"."enum_orders_payment_status" AS ENUM('unpaid', 'advancePaid', 'paid', 'refunded', 'partialRefund');
  CREATE TYPE "public"."enum_orders_fulfilment_status" AS ENUM('pending', 'confirmed', 'packed', 'handedToCourier', 'inTransit', 'delivered', 'returned', 'cancelled');
  CREATE TYPE "public"."enum_orders_zone" AS ENUM('dhakaCity', 'dhakaSub', 'outside');
  CREATE TYPE "public"."enum_orders_courier_provider" AS ENUM('pathao', 'steadfast', 'manual');
  CREATE TYPE "public"."enum_transactions_purpose" AS ENUM('advance', 'full');
  CREATE TYPE "public"."enum_transactions_status" AS ENUM('pending', 'success', 'failed', 'cancelled', 'unknown');
  CREATE TYPE "public"."enum_returns_items_condition" AS ENUM('resellable', 'damaged');
  CREATE TYPE "public"."enum_returns_type" AS ENUM('rto', 'customerReturn');
  CREATE TYPE "public"."enum_returns_condition" AS ENUM('resellable', 'damaged');
  CREATE TYPE "public"."enum_returns_status" AS ENUM('open', 'processed', 'closed');
  CREATE TYPE "public"."enum_capi_queue_status" AS ENUM('pending', 'sent', 'failed');
  CREATE TYPE "public"."enum_accounts_type" AS ENUM('asset', 'liability', 'equity', 'income', 'expense');
  CREATE TYPE "public"."enum_journal_entries_source" AS ENUM('order', 'purchaseOrder', 'courierPayout', 'epsSettlement', 'manual', 'systemClose');
  CREATE TYPE "public"."enum_journal_entries_status" AS ENUM('draft', 'posted', 'void');
  CREATE TYPE "public"."enum_fiscal_periods_status" AS ENUM('open', 'closed');
  CREATE TYPE "public"."enum_courier_payouts_provider" AS ENUM('pathao', 'steadfast');
  CREATE TYPE "public"."enum_courier_payouts_status" AS ENUM('pending', 'reconciled');
  CREATE TYPE "public"."enum_eps_settlements_status" AS ENUM('pending', 'reconciled');
  CREATE TABLE "users_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar,
  	"blur_data_u_r_l" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumb_url" varchar,
  	"sizes_thumb_width" numeric,
  	"sizes_thumb_height" numeric,
  	"sizes_thumb_mime_type" varchar,
  	"sizes_thumb_filesize" numeric,
  	"sizes_thumb_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar,
  	"sizes_thumb_avif_url" varchar,
  	"sizes_thumb_avif_width" numeric,
  	"sizes_thumb_avif_height" numeric,
  	"sizes_thumb_avif_mime_type" varchar,
  	"sizes_thumb_avif_filesize" numeric,
  	"sizes_thumb_avif_filename" varchar,
  	"sizes_card_avif_url" varchar,
  	"sizes_card_avif_width" numeric,
  	"sizes_card_avif_height" numeric,
  	"sizes_card_avif_mime_type" varchar,
  	"sizes_card_avif_filesize" numeric,
  	"sizes_card_avif_filename" varchar,
  	"sizes_hero_avif_url" varchar,
  	"sizes_hero_avif_width" numeric,
  	"sizes_hero_avif_height" numeric,
  	"sizes_hero_avif_mime_type" varchar,
  	"sizes_hero_avif_filesize" numeric,
  	"sizes_hero_avif_filename" varchar
  );
  
  CREATE TABLE "brands" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"logo_id" integer,
  	"country_of_origin" varchar DEFAULT 'South Korea',
  	"story" jsonb,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_og_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"parent_id" integer,
  	"image_id" integer,
  	"description" jsonb,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_og_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "ingredients" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"definition" jsonb,
  	"benefits" varchar,
  	"cautions" varchar,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_og_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "products_skin_types" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_products_skin_types",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "products_concerns" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_products_concerns",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "products_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"alt" varchar
  );
  
  CREATE TABLE "products_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "products" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"brand_id" integer,
  	"short_description" varchar,
  	"description" jsonb,
  	"how_to_use" jsonb,
  	"inci" varchar,
  	"product_type" "enum_products_product_type",
  	"routine_step" numeric,
  	"fulfilment_mode" "enum_products_fulfilment_mode" DEFAULT 'readyStock',
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_og_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_products_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "products_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer,
  	"ingredients_id" integer
  );
  
  CREATE TABLE "_products_v_version_skin_types" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__products_v_version_skin_types",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_products_v_version_concerns" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__products_v_version_concerns",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_products_v_version_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"alt" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_products_v_version_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_products_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_brand_id" integer,
  	"version_short_description" varchar,
  	"version_description" jsonb,
  	"version_how_to_use" jsonb,
  	"version_inci" varchar,
  	"version_product_type" "enum__products_v_version_product_type",
  	"version_routine_step" numeric,
  	"version_fulfilment_mode" "enum__products_v_version_fulfilment_mode" DEFAULT 'readyStock',
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"version_seo_og_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__products_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_products_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer,
  	"ingredients_id" integer
  );
  
  CREATE TABLE "variants" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"product_id" integer NOT NULL,
  	"sku" varchar NOT NULL,
  	"option_size" varchar,
  	"option_shade" varchar,
  	"option_bundle" varchar,
  	"barcode" varchar,
  	"mrp" numeric NOT NULL,
  	"sale_price" numeric,
  	"sale_start" timestamp(3) with time zone,
  	"sale_end" timestamp(3) with time zone,
  	"weight_grams" numeric NOT NULL,
  	"pre_order_lead_days" numeric DEFAULT 15,
  	"image_id" integer,
  	"active" boolean DEFAULT true,
  	"available_qty" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "suppliers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"country" varchar DEFAULT 'South Korea',
  	"contact" varchar,
  	"default_currency" "enum_suppliers_default_currency" DEFAULT 'KRW',
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "purchase_orders_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"variant_id" integer NOT NULL,
  	"qty" numeric NOT NULL,
  	"unit_cost_foreign" numeric NOT NULL,
  	"lot_code" varchar,
  	"mfg_date" timestamp(3) with time zone,
  	"exp_date" timestamp(3) with time zone
  );
  
  CREATE TABLE "purchase_orders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"po_number" varchar NOT NULL,
  	"supplier_id" integer,
  	"currency" "enum_purchase_orders_currency" DEFAULT 'KRW',
  	"fx_rate" numeric NOT NULL,
  	"freight_b_d_t" numeric DEFAULT 0,
  	"duty_b_d_t" numeric DEFAULT 0,
  	"vat_at_import_b_d_t" numeric DEFAULT 0,
  	"clearing_b_d_t" numeric DEFAULT 0,
  	"other_charges_b_d_t" numeric DEFAULT 0,
  	"allocation_basis" "enum_purchase_orders_allocation_basis" DEFAULT 'byValue',
  	"status" "enum_purchase_orders_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "stock_lots_import_docs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"doc_id" integer NOT NULL,
  	"label" varchar
  );
  
  CREATE TABLE "stock_lots" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"variant_id" integer NOT NULL,
  	"lot_code" varchar NOT NULL,
  	"mfg_date" timestamp(3) with time zone,
  	"exp_date" timestamp(3) with time zone,
  	"qty_received" numeric DEFAULT 0,
  	"qty_available" numeric DEFAULT 0,
  	"qty_reserved" numeric DEFAULT 0,
  	"qty_damaged" numeric DEFAULT 0,
  	"purchase_order_id" integer,
  	"landed_cost_per_unit" numeric,
  	"received_at" timestamp(3) with time zone,
  	"short_expiry" boolean DEFAULT false,
  	"status" "enum_stock_lots_status" DEFAULT 'open',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "stock_movements" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"lot_id" integer,
  	"variant_id" integer NOT NULL,
  	"qty" numeric NOT NULL,
  	"type" "enum_stock_movements_type" NOT NULL,
  	"ref_type" varchar,
  	"ref_id" varchar,
  	"actor_id" integer,
  	"at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "carts_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"variant_id" integer NOT NULL,
  	"qty" numeric DEFAULT 1 NOT NULL
  );
  
  CREATE TABLE "carts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"token" varchar NOT NULL,
  	"phone" varchar,
  	"attribution_fbp" varchar,
  	"attribution_fbc" varchar,
  	"attribution_fbclid" varchar,
  	"attribution_utm_source" varchar,
  	"attribution_utm_medium" varchar,
  	"attribution_utm_campaign" varchar,
  	"attribution_landing_path" varchar,
  	"expires_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "otp_challenges" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"phone" varchar NOT NULL,
  	"code_hash" varchar NOT NULL,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"attempts" numeric DEFAULT 0,
  	"locked_until" timestamp(3) with time zone,
  	"ip" varchar,
  	"consumed" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "customers_addresses" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"address" varchar,
  	"zone" "enum_customers_addresses_zone",
  	"landmark" varchar
  );
  
  CREATE TABLE "customers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"phone" varchar NOT NULL,
  	"name" varchar,
  	"email" varchar,
  	"order_count" numeric DEFAULT 0,
  	"delivered_count" numeric DEFAULT 0,
  	"cancelled_count" numeric DEFAULT 0,
  	"lifetime_value" numeric DEFAULT 0,
  	"blacklisted" boolean DEFAULT false,
  	"blacklist_reason" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "orders_items_lot_allocations" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"lot_id" integer,
  	"qty" numeric,
  	"landed_cost_snapshot" numeric
  );
  
  CREATE TABLE "orders_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"variant_id" integer,
  	"title_snapshot" varchar,
  	"sku_snapshot" varchar,
  	"unit_price_snapshot" numeric,
  	"qty" numeric,
  	"line_total" numeric,
  	"fulfilment_mode" varchar
  );
  
  CREATE TABLE "orders_risk_flags" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_orders_risk_flags",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "orders_timeline" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"at" timestamp(3) with time zone,
  	"actor" varchar,
  	"event" varchar,
  	"note" varchar
  );
  
  CREATE TABLE "orders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order_number" varchar,
  	"channel" "enum_orders_channel" DEFAULT 'web',
  	"customer_id" integer,
  	"phone" varchar,
  	"email" varchar,
  	"order_type" "enum_orders_order_type",
  	"subtotal" numeric,
  	"discount_total" numeric DEFAULT 0,
  	"delivery_charge" numeric,
  	"grand_total" numeric,
  	"advance_required" numeric DEFAULT 0,
  	"advance_paid" numeric DEFAULT 0,
  	"cod_amount" numeric,
  	"payment_method" "enum_orders_payment_method",
  	"payment_status" "enum_orders_payment_status" DEFAULT 'unpaid',
  	"fulfilment_status" "enum_orders_fulfilment_status" DEFAULT 'pending',
  	"zone" "enum_orders_zone",
  	"shipping_name" varchar,
  	"shipping_phone" varchar,
  	"shipping_alt_phone" varchar,
  	"shipping_address" varchar,
  	"shipping_city_id" varchar,
  	"shipping_zone_id" varchar,
  	"shipping_area_id" varchar,
  	"shipping_landmark" varchar,
  	"shipping_postcode" varchar,
  	"courier_provider" "enum_orders_courier_provider",
  	"courier_consignment_id" varchar,
  	"courier_tracking_code" varchar,
  	"courier_pushed_at" timestamp(3) with time zone,
  	"courier_last_sync_at" timestamp(3) with time zone,
  	"attribution_fbp" varchar,
  	"attribution_fbc" varchar,
  	"attribution_fbclid" varchar,
  	"attribution_utm_source" varchar,
  	"attribution_utm_medium" varchar,
  	"attribution_utm_campaign" varchar,
  	"attribution_client_ip" varchar,
  	"attribution_user_agent" varchar,
  	"attribution_landing_path" varchar,
  	"attribution_event_ids" jsonb,
  	"internal_notes" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "transactions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order_id" integer,
  	"merchant_transaction_id" varchar NOT NULL,
  	"eps_transaction_id" varchar,
  	"amount" numeric,
  	"purpose" "enum_transactions_purpose",
  	"status" "enum_transactions_status" DEFAULT 'pending',
  	"raw_init" jsonb,
  	"raw_verify" jsonb,
  	"verified_at" timestamp(3) with time zone,
  	"financial_entity" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "returns_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"variant_id" integer,
  	"qty" numeric,
  	"condition" "enum_returns_items_condition"
  );
  
  CREATE TABLE "returns" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order_id" integer,
  	"type" "enum_returns_type",
  	"reason" varchar,
  	"condition" "enum_returns_condition",
  	"restock_lot_id" integer,
  	"refund_amount" numeric,
  	"refund_method" varchar,
  	"status" "enum_returns_status" DEFAULT 'open',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "capi_queue" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"event_name" varchar,
  	"event_id" varchar,
  	"payload" jsonb,
  	"status" "enum_capi_queue_status" DEFAULT 'pending',
  	"attempts" numeric DEFAULT 0,
  	"next_attempt_at" timestamp(3) with time zone,
  	"error" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "accounts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"type" "enum_accounts_type" NOT NULL,
  	"parent_id" integer,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "journal_entries" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"source" "enum_journal_entries_source" NOT NULL,
  	"source_id" varchar,
  	"ref" varchar,
  	"memo" varchar,
  	"status" "enum_journal_entries_status" DEFAULT 'draft',
  	"posted_by_id" integer,
  	"posted_at" timestamp(3) with time zone,
  	"period_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "journal_lines" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"entry_id" integer NOT NULL,
  	"account_id" integer NOT NULL,
  	"debit" numeric DEFAULT 0,
  	"credit" numeric DEFAULT 0,
  	"order_ref" varchar,
  	"po_ref" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "fiscal_periods" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"month" varchar NOT NULL,
  	"status" "enum_fiscal_periods_status" DEFAULT 'open',
  	"closed_at" timestamp(3) with time zone,
  	"closed_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "courier_payouts_consignments" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"consignment_id" varchar,
  	"order_link_id" integer,
  	"cod_collected" numeric DEFAULT 0,
  	"courier_fee" numeric DEFAULT 0,
  	"rto_fee" numeric DEFAULT 0,
  	"matched" boolean DEFAULT false
  );
  
  CREATE TABLE "courier_payouts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"provider" "enum_courier_payouts_provider",
  	"period_start" timestamp(3) with time zone,
  	"period_end" timestamp(3) with time zone,
  	"cod_collected" numeric DEFAULT 0,
  	"courier_fee" numeric DEFAULT 0,
  	"rto_fee" numeric DEFAULT 0,
  	"net_received" numeric DEFAULT 0,
  	"variance" numeric DEFAULT 0,
  	"reconciled_at" timestamp(3) with time zone,
  	"status" "enum_courier_payouts_status" DEFAULT 'pending',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "eps_settlements_transactions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"merchant_transaction_id" varchar,
  	"transaction_id" integer,
  	"gross" numeric DEFAULT 0,
  	"mdr" numeric DEFAULT 0,
  	"matched" boolean DEFAULT false
  );
  
  CREATE TABLE "eps_settlements" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"period_start" timestamp(3) with time zone,
  	"period_end" timestamp(3) with time zone,
  	"gross" numeric DEFAULT 0,
  	"mdr" numeric DEFAULT 0,
  	"net_received" numeric DEFAULT 0,
  	"variance" numeric DEFAULT 0,
  	"reconciled_at" timestamp(3) with time zone,
  	"status" "enum_eps_settlements_status" DEFAULT 'pending',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"brands_id" integer,
  	"categories_id" integer,
  	"ingredients_id" integer,
  	"products_id" integer,
  	"variants_id" integer,
  	"suppliers_id" integer,
  	"purchase_orders_id" integer,
  	"stock_lots_id" integer,
  	"stock_movements_id" integer,
  	"carts_id" integer,
  	"otp_challenges_id" integer,
  	"customers_id" integer,
  	"orders_id" integer,
  	"transactions_id" integer,
  	"returns_id" integer,
  	"capi_queue_id" integer,
  	"accounts_id" integer,
  	"journal_entries_id" integer,
  	"journal_lines_id" integer,
  	"fiscal_periods_id" integer,
  	"courier_payouts_id" integer,
  	"eps_settlements_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"vat_rate_percent" numeric DEFAULT 0,
  	"vat_inclusive" boolean DEFAULT false,
  	"mushak_form" varchar DEFAULT 'Mushak 6.3',
  	"seller_name" varchar DEFAULT 'Decor''s K-Beauty',
  	"seller_address" varchar DEFAULT 'Flat B5, House 32-34, Road 7, Block C, Banani, Dhaka 1212',
  	"seller_bin" varchar,
  	"seller_phone" varchar DEFAULT '+8801712113032',
  	"returns_returns_accepted" boolean DEFAULT true,
  	"returns_return_window_days" numeric DEFAULT 3,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "brands" ADD CONSTRAINT "brands_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "brands" ADD CONSTRAINT "brands_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_skin_types" ADD CONSTRAINT "products_skin_types_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_concerns" ADD CONSTRAINT "products_concerns_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_images" ADD CONSTRAINT "products_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_images" ADD CONSTRAINT "products_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_faq" ADD CONSTRAINT "products_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_ingredients_fk" FOREIGN KEY ("ingredients_id") REFERENCES "public"."ingredients"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_skin_types" ADD CONSTRAINT "_products_v_version_skin_types_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_concerns" ADD CONSTRAINT "_products_v_version_concerns_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_images" ADD CONSTRAINT "_products_v_version_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v_version_images" ADD CONSTRAINT "_products_v_version_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_faq" ADD CONSTRAINT "_products_v_version_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_parent_id_products_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_brand_id_brands_id_fk" FOREIGN KEY ("version_brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_ingredients_fk" FOREIGN KEY ("ingredients_id") REFERENCES "public"."ingredients"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variants" ADD CONSTRAINT "variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "variants" ADD CONSTRAINT "variants_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "purchase_orders_lines" ADD CONSTRAINT "purchase_orders_lines_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "purchase_orders_lines" ADD CONSTRAINT "purchase_orders_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."purchase_orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "stock_lots_import_docs" ADD CONSTRAINT "stock_lots_import_docs_doc_id_media_id_fk" FOREIGN KEY ("doc_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "stock_lots_import_docs" ADD CONSTRAINT "stock_lots_import_docs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."stock_lots"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "stock_lots" ADD CONSTRAINT "stock_lots_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "stock_lots" ADD CONSTRAINT "stock_lots_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_lot_id_stock_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."stock_lots"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "carts_items" ADD CONSTRAINT "carts_items_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "carts_items" ADD CONSTRAINT "carts_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "customers_addresses" ADD CONSTRAINT "customers_addresses_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders_items_lot_allocations" ADD CONSTRAINT "orders_items_lot_allocations_lot_id_stock_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."stock_lots"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders_items_lot_allocations" ADD CONSTRAINT "orders_items_lot_allocations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders_risk_flags" ADD CONSTRAINT "orders_risk_flags_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders_timeline" ADD CONSTRAINT "orders_timeline_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "transactions" ADD CONSTRAINT "transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "returns_items" ADD CONSTRAINT "returns_items_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "returns_items" ADD CONSTRAINT "returns_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."returns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "returns" ADD CONSTRAINT "returns_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "returns" ADD CONSTRAINT "returns_restock_lot_id_stock_lots_id_fk" FOREIGN KEY ("restock_lot_id") REFERENCES "public"."stock_lots"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "accounts" ADD CONSTRAINT "accounts_parent_id_accounts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_posted_by_id_users_id_fk" FOREIGN KEY ("posted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_period_id_fiscal_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."fiscal_periods"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_entry_id_journal_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "fiscal_periods" ADD CONSTRAINT "fiscal_periods_closed_by_id_users_id_fk" FOREIGN KEY ("closed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courier_payouts_consignments" ADD CONSTRAINT "courier_payouts_consignments_order_link_id_orders_id_fk" FOREIGN KEY ("order_link_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courier_payouts_consignments" ADD CONSTRAINT "courier_payouts_consignments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courier_payouts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "eps_settlements_transactions" ADD CONSTRAINT "eps_settlements_transactions_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "eps_settlements_transactions" ADD CONSTRAINT "eps_settlements_transactions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."eps_settlements"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_brands_fk" FOREIGN KEY ("brands_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ingredients_fk" FOREIGN KEY ("ingredients_id") REFERENCES "public"."ingredients"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_variants_fk" FOREIGN KEY ("variants_id") REFERENCES "public"."variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_suppliers_fk" FOREIGN KEY ("suppliers_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_purchase_orders_fk" FOREIGN KEY ("purchase_orders_id") REFERENCES "public"."purchase_orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_stock_lots_fk" FOREIGN KEY ("stock_lots_id") REFERENCES "public"."stock_lots"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_stock_movements_fk" FOREIGN KEY ("stock_movements_id") REFERENCES "public"."stock_movements"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_carts_fk" FOREIGN KEY ("carts_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_otp_challenges_fk" FOREIGN KEY ("otp_challenges_id") REFERENCES "public"."otp_challenges"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_customers_fk" FOREIGN KEY ("customers_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_orders_fk" FOREIGN KEY ("orders_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_transactions_fk" FOREIGN KEY ("transactions_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_returns_fk" FOREIGN KEY ("returns_id") REFERENCES "public"."returns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_capi_queue_fk" FOREIGN KEY ("capi_queue_id") REFERENCES "public"."capi_queue"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_accounts_fk" FOREIGN KEY ("accounts_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_journal_entries_fk" FOREIGN KEY ("journal_entries_id") REFERENCES "public"."journal_entries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_journal_lines_fk" FOREIGN KEY ("journal_lines_id") REFERENCES "public"."journal_lines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_fiscal_periods_fk" FOREIGN KEY ("fiscal_periods_id") REFERENCES "public"."fiscal_periods"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_courier_payouts_fk" FOREIGN KEY ("courier_payouts_id") REFERENCES "public"."courier_payouts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_eps_settlements_fk" FOREIGN KEY ("eps_settlements_id") REFERENCES "public"."eps_settlements"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_roles_order_idx" ON "users_roles" USING btree ("order");
  CREATE INDEX "users_roles_parent_idx" ON "users_roles" USING btree ("parent_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumb_sizes_thumb_filename_idx" ON "media" USING btree ("sizes_thumb_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "media" USING btree ("sizes_hero_filename");
  CREATE INDEX "media_sizes_thumb_avif_sizes_thumb_avif_filename_idx" ON "media" USING btree ("sizes_thumb_avif_filename");
  CREATE INDEX "media_sizes_card_avif_sizes_card_avif_filename_idx" ON "media" USING btree ("sizes_card_avif_filename");
  CREATE INDEX "media_sizes_hero_avif_sizes_hero_avif_filename_idx" ON "media" USING btree ("sizes_hero_avif_filename");
  CREATE UNIQUE INDEX "brands_slug_idx" ON "brands" USING btree ("slug");
  CREATE INDEX "brands_logo_idx" ON "brands" USING btree ("logo_id");
  CREATE INDEX "brands_seo_seo_og_image_idx" ON "brands" USING btree ("seo_og_image_id");
  CREATE INDEX "brands_updated_at_idx" ON "brands" USING btree ("updated_at");
  CREATE INDEX "brands_created_at_idx" ON "brands" USING btree ("created_at");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE INDEX "categories_parent_idx" ON "categories" USING btree ("parent_id");
  CREATE INDEX "categories_image_idx" ON "categories" USING btree ("image_id");
  CREATE INDEX "categories_seo_seo_og_image_idx" ON "categories" USING btree ("seo_og_image_id");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "ingredients_slug_idx" ON "ingredients" USING btree ("slug");
  CREATE INDEX "ingredients_seo_seo_og_image_idx" ON "ingredients" USING btree ("seo_og_image_id");
  CREATE INDEX "ingredients_updated_at_idx" ON "ingredients" USING btree ("updated_at");
  CREATE INDEX "ingredients_created_at_idx" ON "ingredients" USING btree ("created_at");
  CREATE INDEX "products_skin_types_order_idx" ON "products_skin_types" USING btree ("order");
  CREATE INDEX "products_skin_types_parent_idx" ON "products_skin_types" USING btree ("parent_id");
  CREATE INDEX "products_concerns_order_idx" ON "products_concerns" USING btree ("order");
  CREATE INDEX "products_concerns_parent_idx" ON "products_concerns" USING btree ("parent_id");
  CREATE INDEX "products_images_order_idx" ON "products_images" USING btree ("_order");
  CREATE INDEX "products_images_parent_id_idx" ON "products_images" USING btree ("_parent_id");
  CREATE INDEX "products_images_image_idx" ON "products_images" USING btree ("image_id");
  CREATE INDEX "products_faq_order_idx" ON "products_faq" USING btree ("_order");
  CREATE INDEX "products_faq_parent_id_idx" ON "products_faq" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "products_slug_idx" ON "products" USING btree ("slug");
  CREATE INDEX "products_brand_idx" ON "products" USING btree ("brand_id");
  CREATE INDEX "products_seo_seo_og_image_idx" ON "products" USING btree ("seo_og_image_id");
  CREATE INDEX "products_updated_at_idx" ON "products" USING btree ("updated_at");
  CREATE INDEX "products_created_at_idx" ON "products" USING btree ("created_at");
  CREATE INDEX "products__status_idx" ON "products" USING btree ("_status");
  CREATE INDEX "products_rels_order_idx" ON "products_rels" USING btree ("order");
  CREATE INDEX "products_rels_parent_idx" ON "products_rels" USING btree ("parent_id");
  CREATE INDEX "products_rels_path_idx" ON "products_rels" USING btree ("path");
  CREATE INDEX "products_rels_categories_id_idx" ON "products_rels" USING btree ("categories_id");
  CREATE INDEX "products_rels_ingredients_id_idx" ON "products_rels" USING btree ("ingredients_id");
  CREATE INDEX "_products_v_version_skin_types_order_idx" ON "_products_v_version_skin_types" USING btree ("order");
  CREATE INDEX "_products_v_version_skin_types_parent_idx" ON "_products_v_version_skin_types" USING btree ("parent_id");
  CREATE INDEX "_products_v_version_concerns_order_idx" ON "_products_v_version_concerns" USING btree ("order");
  CREATE INDEX "_products_v_version_concerns_parent_idx" ON "_products_v_version_concerns" USING btree ("parent_id");
  CREATE INDEX "_products_v_version_images_order_idx" ON "_products_v_version_images" USING btree ("_order");
  CREATE INDEX "_products_v_version_images_parent_id_idx" ON "_products_v_version_images" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_images_image_idx" ON "_products_v_version_images" USING btree ("image_id");
  CREATE INDEX "_products_v_version_faq_order_idx" ON "_products_v_version_faq" USING btree ("_order");
  CREATE INDEX "_products_v_version_faq_parent_id_idx" ON "_products_v_version_faq" USING btree ("_parent_id");
  CREATE INDEX "_products_v_parent_idx" ON "_products_v" USING btree ("parent_id");
  CREATE INDEX "_products_v_version_version_slug_idx" ON "_products_v" USING btree ("version_slug");
  CREATE INDEX "_products_v_version_version_brand_idx" ON "_products_v" USING btree ("version_brand_id");
  CREATE INDEX "_products_v_version_seo_version_seo_og_image_idx" ON "_products_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_products_v_version_version_updated_at_idx" ON "_products_v" USING btree ("version_updated_at");
  CREATE INDEX "_products_v_version_version_created_at_idx" ON "_products_v" USING btree ("version_created_at");
  CREATE INDEX "_products_v_version_version__status_idx" ON "_products_v" USING btree ("version__status");
  CREATE INDEX "_products_v_created_at_idx" ON "_products_v" USING btree ("created_at");
  CREATE INDEX "_products_v_updated_at_idx" ON "_products_v" USING btree ("updated_at");
  CREATE INDEX "_products_v_latest_idx" ON "_products_v" USING btree ("latest");
  CREATE INDEX "_products_v_rels_order_idx" ON "_products_v_rels" USING btree ("order");
  CREATE INDEX "_products_v_rels_parent_idx" ON "_products_v_rels" USING btree ("parent_id");
  CREATE INDEX "_products_v_rels_path_idx" ON "_products_v_rels" USING btree ("path");
  CREATE INDEX "_products_v_rels_categories_id_idx" ON "_products_v_rels" USING btree ("categories_id");
  CREATE INDEX "_products_v_rels_ingredients_id_idx" ON "_products_v_rels" USING btree ("ingredients_id");
  CREATE INDEX "variants_product_idx" ON "variants" USING btree ("product_id");
  CREATE UNIQUE INDEX "variants_sku_idx" ON "variants" USING btree ("sku");
  CREATE INDEX "variants_image_idx" ON "variants" USING btree ("image_id");
  CREATE INDEX "variants_updated_at_idx" ON "variants" USING btree ("updated_at");
  CREATE INDEX "variants_created_at_idx" ON "variants" USING btree ("created_at");
  CREATE INDEX "suppliers_updated_at_idx" ON "suppliers" USING btree ("updated_at");
  CREATE INDEX "suppliers_created_at_idx" ON "suppliers" USING btree ("created_at");
  CREATE INDEX "purchase_orders_lines_order_idx" ON "purchase_orders_lines" USING btree ("_order");
  CREATE INDEX "purchase_orders_lines_parent_id_idx" ON "purchase_orders_lines" USING btree ("_parent_id");
  CREATE INDEX "purchase_orders_lines_variant_idx" ON "purchase_orders_lines" USING btree ("variant_id");
  CREATE INDEX "purchase_orders_po_number_idx" ON "purchase_orders" USING btree ("po_number");
  CREATE INDEX "purchase_orders_supplier_idx" ON "purchase_orders" USING btree ("supplier_id");
  CREATE INDEX "purchase_orders_updated_at_idx" ON "purchase_orders" USING btree ("updated_at");
  CREATE INDEX "purchase_orders_created_at_idx" ON "purchase_orders" USING btree ("created_at");
  CREATE INDEX "stock_lots_import_docs_order_idx" ON "stock_lots_import_docs" USING btree ("_order");
  CREATE INDEX "stock_lots_import_docs_parent_id_idx" ON "stock_lots_import_docs" USING btree ("_parent_id");
  CREATE INDEX "stock_lots_import_docs_doc_idx" ON "stock_lots_import_docs" USING btree ("doc_id");
  CREATE INDEX "stock_lots_variant_idx" ON "stock_lots" USING btree ("variant_id");
  CREATE INDEX "stock_lots_lot_code_idx" ON "stock_lots" USING btree ("lot_code");
  CREATE INDEX "stock_lots_exp_date_idx" ON "stock_lots" USING btree ("exp_date");
  CREATE INDEX "stock_lots_purchase_order_idx" ON "stock_lots" USING btree ("purchase_order_id");
  CREATE INDEX "stock_lots_updated_at_idx" ON "stock_lots" USING btree ("updated_at");
  CREATE INDEX "stock_lots_created_at_idx" ON "stock_lots" USING btree ("created_at");
  CREATE INDEX "lotCode_idx" ON "stock_lots" USING btree ("lot_code");
  CREATE INDEX "stock_movements_lot_idx" ON "stock_movements" USING btree ("lot_id");
  CREATE INDEX "stock_movements_variant_idx" ON "stock_movements" USING btree ("variant_id");
  CREATE INDEX "stock_movements_actor_idx" ON "stock_movements" USING btree ("actor_id");
  CREATE INDEX "stock_movements_updated_at_idx" ON "stock_movements" USING btree ("updated_at");
  CREATE INDEX "stock_movements_created_at_idx" ON "stock_movements" USING btree ("created_at");
  CREATE INDEX "carts_items_order_idx" ON "carts_items" USING btree ("_order");
  CREATE INDEX "carts_items_parent_id_idx" ON "carts_items" USING btree ("_parent_id");
  CREATE INDEX "carts_items_variant_idx" ON "carts_items" USING btree ("variant_id");
  CREATE UNIQUE INDEX "carts_token_idx" ON "carts" USING btree ("token");
  CREATE INDEX "carts_updated_at_idx" ON "carts" USING btree ("updated_at");
  CREATE INDEX "carts_created_at_idx" ON "carts" USING btree ("created_at");
  CREATE INDEX "otp_challenges_phone_idx" ON "otp_challenges" USING btree ("phone");
  CREATE INDEX "otp_challenges_updated_at_idx" ON "otp_challenges" USING btree ("updated_at");
  CREATE INDEX "otp_challenges_created_at_idx" ON "otp_challenges" USING btree ("created_at");
  CREATE INDEX "customers_addresses_order_idx" ON "customers_addresses" USING btree ("_order");
  CREATE INDEX "customers_addresses_parent_id_idx" ON "customers_addresses" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "customers_phone_idx" ON "customers" USING btree ("phone");
  CREATE INDEX "customers_updated_at_idx" ON "customers" USING btree ("updated_at");
  CREATE INDEX "customers_created_at_idx" ON "customers" USING btree ("created_at");
  CREATE INDEX "orders_items_lot_allocations_order_idx" ON "orders_items_lot_allocations" USING btree ("_order");
  CREATE INDEX "orders_items_lot_allocations_parent_id_idx" ON "orders_items_lot_allocations" USING btree ("_parent_id");
  CREATE INDEX "orders_items_lot_allocations_lot_idx" ON "orders_items_lot_allocations" USING btree ("lot_id");
  CREATE INDEX "orders_items_order_idx" ON "orders_items" USING btree ("_order");
  CREATE INDEX "orders_items_parent_id_idx" ON "orders_items" USING btree ("_parent_id");
  CREATE INDEX "orders_items_variant_idx" ON "orders_items" USING btree ("variant_id");
  CREATE INDEX "orders_risk_flags_order_idx" ON "orders_risk_flags" USING btree ("order");
  CREATE INDEX "orders_risk_flags_parent_idx" ON "orders_risk_flags" USING btree ("parent_id");
  CREATE INDEX "orders_timeline_order_idx" ON "orders_timeline" USING btree ("_order");
  CREATE INDEX "orders_timeline_parent_id_idx" ON "orders_timeline" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "orders_order_number_idx" ON "orders" USING btree ("order_number");
  CREATE INDEX "orders_customer_idx" ON "orders" USING btree ("customer_id");
  CREATE INDEX "orders_phone_idx" ON "orders" USING btree ("phone");
  CREATE INDEX "orders_fulfilment_status_idx" ON "orders" USING btree ("fulfilment_status");
  CREATE INDEX "orders_updated_at_idx" ON "orders" USING btree ("updated_at");
  CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");
  CREATE INDEX "transactions_order_idx" ON "transactions" USING btree ("order_id");
  CREATE UNIQUE INDEX "transactions_merchant_transaction_id_idx" ON "transactions" USING btree ("merchant_transaction_id");
  CREATE INDEX "transactions_updated_at_idx" ON "transactions" USING btree ("updated_at");
  CREATE INDEX "transactions_created_at_idx" ON "transactions" USING btree ("created_at");
  CREATE INDEX "returns_items_order_idx" ON "returns_items" USING btree ("_order");
  CREATE INDEX "returns_items_parent_id_idx" ON "returns_items" USING btree ("_parent_id");
  CREATE INDEX "returns_items_variant_idx" ON "returns_items" USING btree ("variant_id");
  CREATE INDEX "returns_order_idx" ON "returns" USING btree ("order_id");
  CREATE INDEX "returns_restock_lot_idx" ON "returns" USING btree ("restock_lot_id");
  CREATE INDEX "returns_updated_at_idx" ON "returns" USING btree ("updated_at");
  CREATE INDEX "returns_created_at_idx" ON "returns" USING btree ("created_at");
  CREATE INDEX "capi_queue_event_name_idx" ON "capi_queue" USING btree ("event_name");
  CREATE INDEX "capi_queue_event_id_idx" ON "capi_queue" USING btree ("event_id");
  CREATE INDEX "capi_queue_status_idx" ON "capi_queue" USING btree ("status");
  CREATE INDEX "capi_queue_next_attempt_at_idx" ON "capi_queue" USING btree ("next_attempt_at");
  CREATE INDEX "capi_queue_updated_at_idx" ON "capi_queue" USING btree ("updated_at");
  CREATE INDEX "capi_queue_created_at_idx" ON "capi_queue" USING btree ("created_at");
  CREATE UNIQUE INDEX "accounts_code_idx" ON "accounts" USING btree ("code");
  CREATE INDEX "accounts_parent_idx" ON "accounts" USING btree ("parent_id");
  CREATE INDEX "accounts_updated_at_idx" ON "accounts" USING btree ("updated_at");
  CREATE INDEX "accounts_created_at_idx" ON "accounts" USING btree ("created_at");
  CREATE INDEX "journal_entries_date_idx" ON "journal_entries" USING btree ("date");
  CREATE INDEX "journal_entries_source_idx" ON "journal_entries" USING btree ("source");
  CREATE INDEX "journal_entries_source_id_idx" ON "journal_entries" USING btree ("source_id");
  CREATE INDEX "journal_entries_ref_idx" ON "journal_entries" USING btree ("ref");
  CREATE INDEX "journal_entries_status_idx" ON "journal_entries" USING btree ("status");
  CREATE INDEX "journal_entries_posted_by_idx" ON "journal_entries" USING btree ("posted_by_id");
  CREATE INDEX "journal_entries_period_idx" ON "journal_entries" USING btree ("period_id");
  CREATE INDEX "journal_entries_updated_at_idx" ON "journal_entries" USING btree ("updated_at");
  CREATE INDEX "journal_entries_created_at_idx" ON "journal_entries" USING btree ("created_at");
  CREATE UNIQUE INDEX "source_sourceId_ref_idx" ON "journal_entries" USING btree ("source","source_id","ref");
  CREATE INDEX "journal_lines_entry_idx" ON "journal_lines" USING btree ("entry_id");
  CREATE INDEX "journal_lines_account_idx" ON "journal_lines" USING btree ("account_id");
  CREATE INDEX "journal_lines_order_ref_idx" ON "journal_lines" USING btree ("order_ref");
  CREATE INDEX "journal_lines_po_ref_idx" ON "journal_lines" USING btree ("po_ref");
  CREATE INDEX "journal_lines_updated_at_idx" ON "journal_lines" USING btree ("updated_at");
  CREATE INDEX "journal_lines_created_at_idx" ON "journal_lines" USING btree ("created_at");
  CREATE UNIQUE INDEX "fiscal_periods_month_idx" ON "fiscal_periods" USING btree ("month");
  CREATE INDEX "fiscal_periods_closed_by_idx" ON "fiscal_periods" USING btree ("closed_by_id");
  CREATE INDEX "fiscal_periods_updated_at_idx" ON "fiscal_periods" USING btree ("updated_at");
  CREATE INDEX "fiscal_periods_created_at_idx" ON "fiscal_periods" USING btree ("created_at");
  CREATE INDEX "courier_payouts_consignments_order_idx" ON "courier_payouts_consignments" USING btree ("_order");
  CREATE INDEX "courier_payouts_consignments_parent_id_idx" ON "courier_payouts_consignments" USING btree ("_parent_id");
  CREATE INDEX "courier_payouts_consignments_order_link_idx" ON "courier_payouts_consignments" USING btree ("order_link_id");
  CREATE INDEX "courier_payouts_updated_at_idx" ON "courier_payouts" USING btree ("updated_at");
  CREATE INDEX "courier_payouts_created_at_idx" ON "courier_payouts" USING btree ("created_at");
  CREATE INDEX "eps_settlements_transactions_order_idx" ON "eps_settlements_transactions" USING btree ("_order");
  CREATE INDEX "eps_settlements_transactions_parent_id_idx" ON "eps_settlements_transactions" USING btree ("_parent_id");
  CREATE INDEX "eps_settlements_transactions_transaction_idx" ON "eps_settlements_transactions" USING btree ("transaction_id");
  CREATE INDEX "eps_settlements_updated_at_idx" ON "eps_settlements" USING btree ("updated_at");
  CREATE INDEX "eps_settlements_created_at_idx" ON "eps_settlements" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_brands_id_idx" ON "payload_locked_documents_rels" USING btree ("brands_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_ingredients_id_idx" ON "payload_locked_documents_rels" USING btree ("ingredients_id");
  CREATE INDEX "payload_locked_documents_rels_products_id_idx" ON "payload_locked_documents_rels" USING btree ("products_id");
  CREATE INDEX "payload_locked_documents_rels_variants_id_idx" ON "payload_locked_documents_rels" USING btree ("variants_id");
  CREATE INDEX "payload_locked_documents_rels_suppliers_id_idx" ON "payload_locked_documents_rels" USING btree ("suppliers_id");
  CREATE INDEX "payload_locked_documents_rels_purchase_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("purchase_orders_id");
  CREATE INDEX "payload_locked_documents_rels_stock_lots_id_idx" ON "payload_locked_documents_rels" USING btree ("stock_lots_id");
  CREATE INDEX "payload_locked_documents_rels_stock_movements_id_idx" ON "payload_locked_documents_rels" USING btree ("stock_movements_id");
  CREATE INDEX "payload_locked_documents_rels_carts_id_idx" ON "payload_locked_documents_rels" USING btree ("carts_id");
  CREATE INDEX "payload_locked_documents_rels_otp_challenges_id_idx" ON "payload_locked_documents_rels" USING btree ("otp_challenges_id");
  CREATE INDEX "payload_locked_documents_rels_customers_id_idx" ON "payload_locked_documents_rels" USING btree ("customers_id");
  CREATE INDEX "payload_locked_documents_rels_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("orders_id");
  CREATE INDEX "payload_locked_documents_rels_transactions_id_idx" ON "payload_locked_documents_rels" USING btree ("transactions_id");
  CREATE INDEX "payload_locked_documents_rels_returns_id_idx" ON "payload_locked_documents_rels" USING btree ("returns_id");
  CREATE INDEX "payload_locked_documents_rels_capi_queue_id_idx" ON "payload_locked_documents_rels" USING btree ("capi_queue_id");
  CREATE INDEX "payload_locked_documents_rels_accounts_id_idx" ON "payload_locked_documents_rels" USING btree ("accounts_id");
  CREATE INDEX "payload_locked_documents_rels_journal_entries_id_idx" ON "payload_locked_documents_rels" USING btree ("journal_entries_id");
  CREATE INDEX "payload_locked_documents_rels_journal_lines_id_idx" ON "payload_locked_documents_rels" USING btree ("journal_lines_id");
  CREATE INDEX "payload_locked_documents_rels_fiscal_periods_id_idx" ON "payload_locked_documents_rels" USING btree ("fiscal_periods_id");
  CREATE INDEX "payload_locked_documents_rels_courier_payouts_id_idx" ON "payload_locked_documents_rels" USING btree ("courier_payouts_id");
  CREATE INDEX "payload_locked_documents_rels_eps_settlements_id_idx" ON "payload_locked_documents_rels" USING btree ("eps_settlements_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_roles" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "brands" CASCADE;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "ingredients" CASCADE;
  DROP TABLE "products_skin_types" CASCADE;
  DROP TABLE "products_concerns" CASCADE;
  DROP TABLE "products_images" CASCADE;
  DROP TABLE "products_faq" CASCADE;
  DROP TABLE "products" CASCADE;
  DROP TABLE "products_rels" CASCADE;
  DROP TABLE "_products_v_version_skin_types" CASCADE;
  DROP TABLE "_products_v_version_concerns" CASCADE;
  DROP TABLE "_products_v_version_images" CASCADE;
  DROP TABLE "_products_v_version_faq" CASCADE;
  DROP TABLE "_products_v" CASCADE;
  DROP TABLE "_products_v_rels" CASCADE;
  DROP TABLE "variants" CASCADE;
  DROP TABLE "suppliers" CASCADE;
  DROP TABLE "purchase_orders_lines" CASCADE;
  DROP TABLE "purchase_orders" CASCADE;
  DROP TABLE "stock_lots_import_docs" CASCADE;
  DROP TABLE "stock_lots" CASCADE;
  DROP TABLE "stock_movements" CASCADE;
  DROP TABLE "carts_items" CASCADE;
  DROP TABLE "carts" CASCADE;
  DROP TABLE "otp_challenges" CASCADE;
  DROP TABLE "customers_addresses" CASCADE;
  DROP TABLE "customers" CASCADE;
  DROP TABLE "orders_items_lot_allocations" CASCADE;
  DROP TABLE "orders_items" CASCADE;
  DROP TABLE "orders_risk_flags" CASCADE;
  DROP TABLE "orders_timeline" CASCADE;
  DROP TABLE "orders" CASCADE;
  DROP TABLE "transactions" CASCADE;
  DROP TABLE "returns_items" CASCADE;
  DROP TABLE "returns" CASCADE;
  DROP TABLE "capi_queue" CASCADE;
  DROP TABLE "accounts" CASCADE;
  DROP TABLE "journal_entries" CASCADE;
  DROP TABLE "journal_lines" CASCADE;
  DROP TABLE "fiscal_periods" CASCADE;
  DROP TABLE "courier_payouts_consignments" CASCADE;
  DROP TABLE "courier_payouts" CASCADE;
  DROP TABLE "eps_settlements_transactions" CASCADE;
  DROP TABLE "eps_settlements" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "settings" CASCADE;
  DROP TYPE "public"."enum_users_roles";
  DROP TYPE "public"."enum_products_skin_types";
  DROP TYPE "public"."enum_products_concerns";
  DROP TYPE "public"."enum_products_product_type";
  DROP TYPE "public"."enum_products_fulfilment_mode";
  DROP TYPE "public"."enum_products_status";
  DROP TYPE "public"."enum__products_v_version_skin_types";
  DROP TYPE "public"."enum__products_v_version_concerns";
  DROP TYPE "public"."enum__products_v_version_product_type";
  DROP TYPE "public"."enum__products_v_version_fulfilment_mode";
  DROP TYPE "public"."enum__products_v_version_status";
  DROP TYPE "public"."enum_suppliers_default_currency";
  DROP TYPE "public"."enum_purchase_orders_currency";
  DROP TYPE "public"."enum_purchase_orders_allocation_basis";
  DROP TYPE "public"."enum_purchase_orders_status";
  DROP TYPE "public"."enum_stock_lots_status";
  DROP TYPE "public"."enum_stock_movements_type";
  DROP TYPE "public"."enum_customers_addresses_zone";
  DROP TYPE "public"."enum_orders_risk_flags";
  DROP TYPE "public"."enum_orders_channel";
  DROP TYPE "public"."enum_orders_order_type";
  DROP TYPE "public"."enum_orders_payment_method";
  DROP TYPE "public"."enum_orders_payment_status";
  DROP TYPE "public"."enum_orders_fulfilment_status";
  DROP TYPE "public"."enum_orders_zone";
  DROP TYPE "public"."enum_orders_courier_provider";
  DROP TYPE "public"."enum_transactions_purpose";
  DROP TYPE "public"."enum_transactions_status";
  DROP TYPE "public"."enum_returns_items_condition";
  DROP TYPE "public"."enum_returns_type";
  DROP TYPE "public"."enum_returns_condition";
  DROP TYPE "public"."enum_returns_status";
  DROP TYPE "public"."enum_capi_queue_status";
  DROP TYPE "public"."enum_accounts_type";
  DROP TYPE "public"."enum_journal_entries_source";
  DROP TYPE "public"."enum_journal_entries_status";
  DROP TYPE "public"."enum_fiscal_periods_status";
  DROP TYPE "public"."enum_courier_payouts_provider";
  DROP TYPE "public"."enum_courier_payouts_status";
  DROP TYPE "public"."enum_eps_settlements_status";`)
}
