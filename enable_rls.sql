-- Enable RLS and create open policies for all relevant tables

-- Branches
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read for all users" ON branches;
CREATE POLICY "Enable read for all users" ON branches FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert for all users" ON branches;
CREATE POLICY "Enable insert for all users" ON branches FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update for all users" ON branches;
CREATE POLICY "Enable update for all users" ON branches FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Enable delete for all users" ON branches;
CREATE POLICY "Enable delete for all users" ON branches FOR DELETE USING (true);

-- Regions
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read for all users" ON regions;
CREATE POLICY "Enable read for all users" ON regions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert for all users" ON regions;
CREATE POLICY "Enable insert for all users" ON regions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update for all users" ON regions;
CREATE POLICY "Enable update for all users" ON regions FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Enable delete for all users" ON regions;
CREATE POLICY "Enable delete for all users" ON regions FOR DELETE USING (true);

-- Sponsors
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read for all users" ON sponsors;
CREATE POLICY "Enable read for all users" ON sponsors FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert for all users" ON sponsors;
CREATE POLICY "Enable insert for all users" ON sponsors FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update for all users" ON sponsors;
CREATE POLICY "Enable update for all users" ON sponsors FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Enable delete for all users" ON sponsors;
CREATE POLICY "Enable delete for all users" ON sponsors FOR DELETE USING (true);

-- User Profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read for all users" ON user_profiles;
CREATE POLICY "Enable read for all users" ON user_profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert for all users" ON user_profiles;
CREATE POLICY "Enable insert for all users" ON user_profiles FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update for all users" ON user_profiles;
CREATE POLICY "Enable update for all users" ON user_profiles FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Enable delete for all users" ON user_profiles;
CREATE POLICY "Enable delete for all users" ON user_profiles FOR DELETE USING (true);

-- Categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read for all users" ON categories;
CREATE POLICY "Enable read for all users" ON categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert for all users" ON categories;
CREATE POLICY "Enable insert for all users" ON categories FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update for all users" ON categories;
CREATE POLICY "Enable update for all users" ON categories FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Enable delete for all users" ON categories;
CREATE POLICY "Enable delete for all users" ON categories FOR DELETE USING (true);

-- Health Conditions
ALTER TABLE health_conditions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read for all users" ON health_conditions;
CREATE POLICY "Enable read for all users" ON health_conditions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert for all users" ON health_conditions;
CREATE POLICY "Enable insert for all users" ON health_conditions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update for all users" ON health_conditions;
CREATE POLICY "Enable update for all users" ON health_conditions FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Enable delete for all users" ON health_conditions;
CREATE POLICY "Enable delete for all users" ON health_conditions FOR DELETE USING (true);

-- Audit Logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read for all users" ON audit_logs;
CREATE POLICY "Enable read for all users" ON audit_logs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert for all users" ON audit_logs;
CREATE POLICY "Enable insert for all users" ON audit_logs FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update for all users" ON audit_logs;
CREATE POLICY "Enable update for all users" ON audit_logs FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Enable delete for all users" ON audit_logs;
CREATE POLICY "Enable delete for all users" ON audit_logs FOR DELETE USING (true);

-- Print Settings
ALTER TABLE print_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read for all users" ON print_settings;
CREATE POLICY "Enable read for all users" ON print_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert for all users" ON print_settings;
CREATE POLICY "Enable insert for all users" ON print_settings FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update for all users" ON print_settings;
CREATE POLICY "Enable update for all users" ON print_settings FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Enable delete for all users" ON print_settings;
CREATE POLICY "Enable delete for all users" ON print_settings FOR DELETE USING (true);

-- Beneficiaries
ALTER TABLE beneficiaries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read for all users" ON beneficiaries;
CREATE POLICY "Enable read for all users" ON beneficiaries FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert for all users" ON beneficiaries;
CREATE POLICY "Enable insert for all users" ON beneficiaries FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update for all users" ON beneficiaries;
CREATE POLICY "Enable update for all users" ON beneficiaries FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Enable delete for all users" ON beneficiaries;
CREATE POLICY "Enable delete for all users" ON beneficiaries FOR DELETE USING (true);

-- Sponsor Subscriptions
ALTER TABLE sponsor_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read for all users" ON sponsor_subscriptions;
CREATE POLICY "Enable read for all users" ON sponsor_subscriptions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert for all users" ON sponsor_subscriptions;
CREATE POLICY "Enable insert for all users" ON sponsor_subscriptions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update for all users" ON sponsor_subscriptions;
CREATE POLICY "Enable update for all users" ON sponsor_subscriptions FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Enable delete for all users" ON sponsor_subscriptions;
CREATE POLICY "Enable delete for all users" ON sponsor_subscriptions FOR DELETE USING (true);
