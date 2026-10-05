-- ==============================================================================
-- SafeLabel AI - PostgreSQL Database Schema
-- Based on Entity Relationship Diagram (ERD) & System Architecture
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. USERS & PROFILES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL DEFAULT 'User',
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) DEFAULT 'User',
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    notifications BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. ALLERGENS & INGREDIENTS KNOWLEDGE BASE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS allergens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'General',
    description TEXT,
    terms TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_allergies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    allergen_id UUID NOT NULL REFERENCES allergens(id) ON DELETE CASCADE,
    severity VARCHAR(50) NOT NULL DEFAULT 'high', -- low, medium, high
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_allergen UNIQUE(user_id, allergen_id)
);

CREATE TABLE IF NOT EXISTS ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    normalized_name VARCHAR(100) NOT NULL,
    synonyms TEXT,
    category VARCHAR(50) DEFAULT 'General',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ingredient_allergens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    allergen_id UUID NOT NULL REFERENCES allergens(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_ingredient_allergen UNIQUE(ingredient_id, allergen_id)
);

-- ------------------------------------------------------------------------------
-- 3. PRODUCT CATALOG
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barcode VARCHAR(50) UNIQUE,
    product_name VARCHAR(200) NOT NULL,
    brand VARCHAR(100) DEFAULT '',
    image_url TEXT,
    ingredients_text TEXT NOT NULL DEFAULT '',
    country VARCHAR(50) DEFAULT '',
    category VARCHAR(50) NOT NULL DEFAULT 'Food & Beverage',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. SCANS, DETECTIONS & TRANSLATIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    product_id UUID REFERENCES product_info(id) ON DELETE SET NULL,
    barcode VARCHAR(50),
    image_url TEXT,
    extracted_text TEXT NOT NULL DEFAULT '',
    language VARCHAR(10) DEFAULT 'en',
    source VARCHAR(20) NOT NULL DEFAULT 'ocr', -- barcode, image, ocr
    verdict VARCHAR(20) NOT NULL DEFAULT 'safe', -- safe, caution, danger
    detected_allergens TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scan_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE SET NULL,
    allergen_id UUID REFERENCES allergens(id) ON DELETE SET NULL,
    confidence DECIMAL(5,2) NOT NULL DEFAULT 0.90,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scan_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    scan_type VARCHAR(20) NOT NULL DEFAULT 'image', -- barcode, image
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    original_text TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    source_language VARCHAR(10) NOT NULL,
    target_language VARCHAR(10) NOT NULL,
    provider VARCHAR(20) NOT NULL DEFAULT 'google', -- google, libre
    confidence DECIMAL(5,2) NOT NULL DEFAULT 0.95,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. ADMIN MANAGEMENT & AUDIT LOGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'admin', -- super_admin, admin
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    target_table VARCHAR(50),
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Backward compatibility table for system logs
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level VARCHAR(20) NOT NULL DEFAULT 'INFO',
    event VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. INDEXES FOR HIGH-PERFORMANCE SEARCHES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_product_info_barcode ON product_info(barcode);
CREATE INDEX IF NOT EXISTS idx_scans_user ON scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_barcode ON scans(barcode);
CREATE INDEX IF NOT EXISTS idx_scans_created ON scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_results_scan ON scan_results(scan_id);
CREATE INDEX IF NOT EXISTS idx_scan_history_user ON scan_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);
CREATE INDEX IF NOT EXISTS idx_allergens_name ON allergens(name);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_logs(admin_id);

-- ------------------------------------------------------------------------------
-- 7. BACKWARD COMPATIBILITY COMPAT VIEW: products
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW products AS
SELECT
    id,
    barcode,
    product_name AS name,
    brand,
    image_url,
    ingredients_text,
    country,
    category,
    status,
    created_at
FROM product_info;

-- Allow INSERT / UPDATE / DELETE on the products view seamlessly
CREATE OR REPLACE FUNCTION trg_products_dml()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO product_info (id, barcode, product_name, brand, image_url, ingredients_text, country, category, status)
        VALUES (
            COALESCE(NEW.id, gen_random_uuid()),
            NEW.barcode,
            COALESCE(NEW.name, 'Product'),
            COALESCE(NEW.brand, ''),
            NEW.image_url,
            COALESCE(NEW.ingredients_text, ''),
            COALESCE(NEW.country, ''),
            COALESCE(NEW.category, 'Food & Beverage'),
            COALESCE(NEW.status, 'active')
        )
        RETURNING id, barcode, product_name, brand, image_url, ingredients_text, country, category, status, created_at
        INTO NEW.id, NEW.barcode, NEW.name, NEW.brand, NEW.image_url, NEW.ingredients_text, NEW.country, NEW.category, NEW.status, NEW.created_at;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE product_info
        SET barcode = NEW.barcode,
            product_name = COALESCE(NEW.name, product_info.product_name),
            brand = COALESCE(NEW.brand, product_info.brand),
            image_url = NEW.image_url,
            ingredients_text = COALESCE(NEW.ingredients_text, product_info.ingredients_text),
            country = COALESCE(NEW.country, product_info.country),
            category = COALESCE(NEW.category, product_info.category),
            status = COALESCE(NEW.status, product_info.status)
        WHERE id = OLD.id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        DELETE FROM product_info WHERE id = OLD.id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_instead_of ON products;
CREATE TRIGGER trg_products_instead_of
INSTEAD OF INSERT OR UPDATE OR DELETE ON products
FOR EACH ROW EXECUTE FUNCTION trg_products_dml();
