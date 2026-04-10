-- 1. Enable UPDATE and DELETE policies for sponsor_subscriptions
CREATE POLICY "Enable update for authenticated users" ON sponsor_subscriptions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete for authenticated users" ON sponsor_subscriptions FOR DELETE TO authenticated USING (true);
