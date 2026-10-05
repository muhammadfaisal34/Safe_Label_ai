-- ==============================================================================
-- SafeLabel AI - Comprehensive PostgreSQL Seed Data
-- ==============================================================================

-- 1. ADMIN USERS (password: admin123 -> pbkdf2_sha256$240000$5a51152da954839db2c1e1d252158398$0d6a185c59830790ec3ae5b49326a44ccfdd84e05f029a6a05cba648d4246bbc)
INSERT INTO admin_users (id, name, email, password_hash, role) VALUES
('a0000000-0000-0000-0000-000000000001', 'System Administrator', 'admin@safelabelai.com', 'pbkdf2_sha256$240000$5a51152da954839db2c1e1d252158398$0d6a185c59830790ec3ae5b49326a44ccfdd84e05f029a6a05cba648d4246bbc', 'super_admin'),
('a0000000-0000-0000-0000-000000000002', 'Ayesha Khan', 'ayesha@example.com', 'pbkdf2_sha256$240000$5a51152da954839db2c1e1d252158398$0d6a185c59830790ec3ae5b49326a44ccfdd84e05f029a6a05cba648d4246bbc', 'admin')
ON CONFLICT (email) DO NOTHING;

-- 2. MOBILE APP USERS
INSERT INTO users (id, name, display_name, email, password_hash, role, status) VALUES
('01000000-0000-0000-0000-000000000001', 'Faisal Ahmed', 'Faisal Ahmed', 'faisal@example.com', 'pbkdf2_sha256$240000$5a51152da954839db2c1e1d252158398$0d6a185c59830790ec3ae5b49326a44ccfdd84e05f029a6a05cba648d4246bbc', 'user', 'active'),
('01000000-0000-0000-0000-000000000002', 'Ali Raza', 'Ali Raza', 'ali@example.com', 'pbkdf2_sha256$240000$5a51152da954839db2c1e1d252158398$0d6a185c59830790ec3ae5b49326a44ccfdd84e05f029a6a05cba648d4246bbc', 'user', 'active'),
('01000000-0000-0000-0000-000000000003', 'Sara Ahmed', 'Sara Ahmed', 'sara@example.com', 'pbkdf2_sha256$240000$5a51152da954839db2c1e1d252158398$0d6a185c59830790ec3ae5b49326a44ccfdd84e05f029a6a05cba648d4246bbc', 'user', 'active'),
('01000000-0000-0000-0000-000000000004', 'Fatima Noor', 'Fatima Noor', 'fatima@example.com', 'pbkdf2_sha256$240000$5a51152da954839db2c1e1d252158398$0d6a185c59830790ec3ae5b49326a44ccfdd84e05f029a6a05cba648d4246bbc', 'user', 'active'),
('01000000-0000-0000-0000-000000000005', 'Hassan Ali', 'Hassan Ali', 'hassan@example.com', 'pbkdf2_sha256$240000$5a51152da954839db2c1e1d252158398$0d6a185c59830790ec3ae5b49326a44ccfdd84e05f029a6a05cba648d4246bbc', 'user', 'active'),
('01000000-0000-0000-0000-000000000000', 'Admin User', 'Admin', 'admin@safelabelai.com', 'pbkdf2_sha256$240000$5a51152da954839db2c1e1d252158398$0d6a185c59830790ec3ae5b49326a44ccfdd84e05f029a6a05cba648d4246bbc', 'admin', 'active')
ON CONFLICT (email) DO NOTHING;

-- 3. USER PROFILES
INSERT INTO user_profiles (id, user_id, language, notifications) VALUES
(gen_random_uuid(), '01000000-0000-0000-0000-000000000001', 'en', true),
(gen_random_uuid(), '01000000-0000-0000-0000-000000000002', 'en', true),
(gen_random_uuid(), '01000000-0000-0000-0000-000000000003', 'de', false),
(gen_random_uuid(), '01000000-0000-0000-0000-000000000004', 'en', true),
(gen_random_uuid(), '01000000-0000-0000-0000-000000000005', 'ur', true)
ON CONFLICT (user_id) DO NOTHING;

-- 4. ALLERGENS DICTIONARY
INSERT INTO allergens (id, name, category, description, terms) VALUES
('02000000-0000-0000-0000-000000000001', 'Peanuts', 'Nut', 'Groundnuts and peanut protein derivatives', ARRAY['peanut', 'groundnut', 'arachis', 'erdnuss', 'cacahuate']),
('02000000-0000-0000-0000-000000000002', 'Milk / Dairy', 'Dairy', 'Cow milk, lactose, casein, and whey protein', ARRAY['milk', 'whey', 'casein', 'lactose', 'butter', 'cream', 'milch', 'lait']),
('02000000-0000-0000-0000-000000000003', 'Wheat / Gluten', 'Cereal', 'Gluten found in wheat, barley, rye, and spelt', ARRAY['wheat', 'gluten', 'weizen', 'ble', 'flour', 'barley', 'rye']),
('02000000-0000-0000-0000-000000000004', 'Tree Nuts', 'Nut', 'Almonds, hazelnuts, walnuts, cashews, and pistachios', ARRAY['almond', 'hazelnut', 'walnut', 'cashew', 'pistachio', 'haselnuss']),
('02000000-0000-0000-0000-000000000005', 'Soybeans', 'Legume', 'Soy protein, soy lecithin, and edamame', ARRAY['soy', 'soya', 'soybean', 'soylecithin', 'edamame']),
('02000000-0000-0000-0000-000000000006', 'Eggs', 'Poultry', 'Egg albumin, yolk, and lysozyme', ARRAY['egg', 'albumin', 'lysozyme', 'ovalbumin', 'ei']),
('02000000-0000-0000-0000-000000000007', 'Fish & Shellfish', 'Seafood', 'Fin fish, crustaceans, and shellfish', ARRAY['fish', 'salmon', 'tuna', 'shrimp', 'crab', 'lobster', 'fisch']),
('02000000-0000-0000-0000-000000000008', 'Sesame', 'Seed', 'Sesame seeds and tahini', ARRAY['sesame', 'tahini', 'sesamum', 'sesam'])
ON CONFLICT (name) DO NOTHING;

-- 5. USER ALLERGIES
INSERT INTO user_allergies (user_id, allergen_id, severity, notes) VALUES
('01000000-0000-0000-0000-000000000001', '02000000-0000-0000-0000-000000000001', 'high', 'Severe anaphylaxis risk from peanuts'),
('01000000-0000-0000-0000-000000000001', '02000000-0000-0000-0000-000000000002', 'medium', 'Lactose intolerance'),
('01000000-0000-0000-0000-000000000002', '02000000-0000-0000-0000-000000000003', 'high', 'Celiac disease - strict wheat avoidance'),
('01000000-0000-0000-0000-000000000003', '02000000-0000-0000-0000-000000000004', 'high', 'Severe hazelnut and walnut allergy'),
('01000000-0000-0000-0000-000000000004', '02000000-0000-0000-0000-000000000005', 'medium', 'Mild hives from soy products')
ON CONFLICT (user_id, allergen_id) DO NOTHING;

-- 6. INGREDIENTS
INSERT INTO ingredients (id, name, normalized_name, synonyms, category) VALUES
('03000000-0000-0000-0000-000000000001', 'Peanut Butter', 'peanut', 'groundnuts, peanut paste, arachis oil', 'Nut'),
('03000000-0000-0000-0000-000000000002', 'Skimmed Milk Powder', 'milk', 'dried milk, nonfat milk solids, whey', 'Dairy'),
('03000000-0000-0000-0000-000000000003', 'Wheat Flour', 'wheat', 'all-purpose flour, weizenmehl, gluten', 'Cereal'),
('03000000-0000-0000-0000-000000000004', 'Hazelnuts', 'hazelnut', 'filberts, haselnusse, hazelnut paste', 'Nut'),
('03000000-0000-0000-0000-000000000005', 'Soy Lecithin', 'soy', 'soya lecithin, E322, lecithin', 'Emulsifier'),
('03000000-0000-0000-0000-000000000006', 'Cocoa Butter', 'cocoa butter', 'theobroma oil, cocoa fat', 'Fat')
ON CONFLICT DO NOTHING;

-- 7. INGREDIENT ALLERGENS
INSERT INTO ingredient_allergens (ingredient_id, allergen_id) VALUES
('03000000-0000-0000-0000-000000000001', '02000000-0000-0000-0000-000000000001'),
('03000000-0000-0000-0000-000000000002', '02000000-0000-0000-0000-000000000002'),
('03000000-0000-0000-0000-000000000003', '02000000-0000-0000-0000-000000000003'),
('03000000-0000-0000-0000-000000000004', '02000000-0000-0000-0000-000000000004'),
('03000000-0000-0000-0000-000000000005', '02000000-0000-0000-0000-000000000005')
ON CONFLICT (ingredient_id, allergen_id) DO NOTHING;

-- 8. PRODUCT INFO (CATALOG)
INSERT INTO product_info (id, barcode, product_name, brand, image_url, ingredients_text, country, category, status) VALUES
('04000000-0000-0000-0000-000000000001', '4008400404127', 'Kinder Chocolate', 'Ferrero', 'https://images.openfoodfacts.org/images/products/400/840/040/4127/front_en.jpg', 'Milk Chocolate (40%), Sugar, Whole Milk Powder, Cocoa Butter, Soy Lecithin, Vanillin', 'Germany', 'Confectionery', 'active'),
('04000000-0000-0000-0000-000000000002', '3017620422003', 'Nutella Hazelnut Spread', 'Ferrero', 'https://images.openfoodfacts.org/images/products/301/762/042/2003/front_en.jpg', 'Sugar, Palm Oil, Hazelnuts (13%), Skimmed Milk Powder (8.7%), Fat-Reduced Cocoa, Soy Lecithin, Vanillin', 'Italy', 'Spreads', 'active'),
('04000000-0000-0000-0000-000000000003', '7622210449283', 'Oreo Original Cookies', 'Mondelez', 'https://images.openfoodfacts.org/images/products/762/221/044/9283/front_en.jpg', 'Wheat Flour, Sugar, Palm Oil, Cocoa Powder, Glucose-Fructose Syrup, Raising Agents, Soy Lecithin', 'United Kingdom', 'Snacks', 'active'),
('04000000-0000-0000-0000-000000000004', '5449000000996', 'Coca-Cola Original Taste', 'Coca-Cola', 'https://images.openfoodfacts.org/images/products/544/900/000/0996/front_en.jpg', 'Carbonated Water, Sugar, Caramel Color, Phosphoric Acid, Natural Flavorings, Caffeine', 'United States', 'Beverages', 'active'),
('04000000-0000-0000-0000-000000000005', '8712566324088', 'Organic Oat Milk', 'Oatly', 'https://images.openfoodfacts.org/images/products/871/256/632/4088/front_en.jpg', 'Oat Base (Water, Oats 10%), Rapeseed Oil, Calcium Carbonate, Sea Salt', 'Sweden', 'Dairy', 'active'),
('04000000-0000-0000-0000-000000000006', '8438221034451', 'Gold Standard 100% Whey', 'Optimum Nutrition', 'https://images.openfoodfacts.org/images/products/843/822/103/4451/front_en.jpg', 'Protein Blend (Whey Protein Isolate, Whey Protein Concentrate), Cocoa, Soy Lecithin', 'United States', 'Supplements', 'active')
ON CONFLICT (barcode) DO NOTHING;

-- 9. SCANS
INSERT INTO scans (id, user_id, product_id, barcode, extracted_text, language, source, verdict, detected_allergens) VALUES
('05000000-0000-0000-0000-000000000001', '01000000-0000-0000-0000-000000000001', '04000000-0000-0000-0000-000000000002', '3017620422003', 'Zutaten: Zucker, Palmöl, Haselnüsse (13%), Magermilchpulver (8.7%), Kakao, Sojalecithin.', 'de', 'ocr', 'danger', ARRAY['hazelnut', 'milk', 'soy']),
('05000000-0000-0000-0000-000000000002', '01000000-0000-0000-0000-000000000002', '04000000-0000-0000-0000-000000000004', '5449000000996', 'Carbonated water, sugar, caramel color, phosphoric acid, natural flavorings, caffeine.', 'en', 'barcode', 'safe', ARRAY[]::TEXT[]),
('05000000-0000-0000-0000-000000000003', '01000000-0000-0000-0000-000000000003', '04000000-0000-0000-0000-000000000003', '7622210449283', 'Wheat flour, sugar, palm oil, cocoa powder, glucose-fructose syrup. May contain traces of milk.', 'en', 'image', 'caution', ARRAY['wheat', 'milk']),
('05000000-0000-0000-0000-000000000004', '01000000-0000-0000-0000-000000000004', '04000000-0000-0000-0000-000000000001', '4008400404127', 'Milk chocolate 40%, sugar, whole milk powder, cocoa butter, soy lecithin. Kann Spuren von Erdnuss enthalten.', 'de', 'ocr', 'danger', ARRAY['milk', 'peanut', 'soy'])
ON CONFLICT DO NOTHING;

-- 10. SCAN RESULTS
INSERT INTO scan_results (scan_id, ingredient_id, allergen_id, confidence, reason) VALUES
('05000000-0000-0000-0000-000000000001', '03000000-0000-0000-0000-000000000004', '02000000-0000-0000-0000-000000000004', 0.98, 'Direct match: "Haselnüsse" maps to Tree Nuts'),
('05000000-0000-0000-0000-000000000001', '03000000-0000-0000-0000-000000000002', '02000000-0000-0000-0000-000000000002', 0.95, 'Direct match: "Magermilchpulver" contains Milk / Dairy'),
('05000000-0000-0000-0000-000000000003', '03000000-0000-0000-0000-000000000003', '02000000-0000-0000-0000-000000000003', 0.99, 'Direct match: "Wheat flour" contains Wheat / Gluten'),
('05000000-0000-0000-0000-000000000004', '03000000-0000-0000-0000-000000000001', '02000000-0000-0000-0000-000000000001', 0.94, 'Precaution match: "Kann Spuren von Erdnuss enthalten" maps to Peanuts')
ON CONFLICT DO NOTHING;

-- 11. SCAN HISTORY
INSERT INTO scan_history (user_id, scan_id, scan_type) VALUES
('01000000-0000-0000-0000-000000000001', '05000000-0000-0000-0000-000000000001', 'ocr'),
('01000000-0000-0000-0000-000000000002', '05000000-0000-0000-0000-000000000002', 'barcode'),
('01000000-0000-0000-0000-000000000003', '05000000-0000-0000-0000-000000000003', 'image'),
('01000000-0000-0000-0000-000000000004', '05000000-0000-0000-0000-000000000004', 'ocr')
ON CONFLICT DO NOTHING;

-- 12. TRANSLATIONS
INSERT INTO translations (scan_id, original_text, translated_text, source_language, target_language, provider, confidence) VALUES
('05000000-0000-0000-0000-000000000001', 'Zutaten: Zucker, Palmöl, Haselnüsse (13%), Magermilchpulver (8.7%), Kakao, Sojalecithin.', 'Ingredients: Sugar, palm oil, hazelnuts (13%), skimmed milk powder (8.7%), cocoa, soy lecithin.', 'de', 'en', 'google', 0.98),
('05000000-0000-0000-0000-000000000004', 'Kann Spuren von Erdnuss enthalten.', 'May contain traces of peanut.', 'de', 'en', 'google', 0.96)
ON CONFLICT DO NOTHING;

-- 13. ADMIN LOGS
INSERT INTO admin_logs (admin_id, action, target_table, details) VALUES
('a0000000-0000-0000-0000-000000000001', 'INITIALIZE_SCHEMA', 'system', 'PostgreSQL ERD schema and indexes synchronized successfully.'),
('a0000000-0000-0000-0000-000000000001', 'LOGIN', 'admin_users', 'Admin signed into SafeLabel AI control panel.'),
('a0000000-0000-0000-0000-000000000001', 'UPDATE_ALLERGENS', 'allergens', 'Updated terms and keyword dictionary for Peanut and Dairy categories.')
ON CONFLICT DO NOTHING;

-- System audit logs
INSERT INTO system_logs (level, event, message) VALUES
('INFO', 'SYSTEM_BOOT', 'SafeLabel AI backend server initialized with PostgreSQL database.'),
('INFO', 'OCR_READY', 'PaddleOCR engine and spaCy allergen detection pipeline loaded.'),
('INFO', 'USER_LOGIN', 'User faisal@example.com logged in via mobile client.'),
('WARNING', 'ALLERGEN_ALERT', 'Allergen Peanut detected with 94% confidence in scan 05000000-0000-0000-0000-000000000004')
ON CONFLICT DO NOTHING;
