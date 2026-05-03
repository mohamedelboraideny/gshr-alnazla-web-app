import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';

// Supabase Configuration (Server-side only)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('CRITICAL: Supabase environment variables are missing! Please check your .env file.');
}

const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', supabase: !!supabaseUrl && !!supabaseKey });
  });

  // --- API Routes ---

  // Paginated Beneficiaries
  app.get('/api/beneficiaries/paginated', async (req: express.Request, res: express.Response) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
    
    const page = parseInt(req.query.page as string) || 0;
    const limit = parseInt(req.query.limit as string) || 20;
    const from = page * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('beneficiaries')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('createdAt', { ascending: false });

    if (req.query.searchTerm) {
      query = query.or(`name.ilike.%${req.query.searchTerm}%,nationalId.ilike.%${req.query.searchTerm}%`);
    }
    if (req.query.regionId) query = query.eq('regionId', req.query.regionId);
    if (req.query.sponsorshipStatus) query = query.eq('sponsorshipStatus', req.query.sponsorshipStatus);
    if (req.query.gender) query = query.eq('gender', req.query.gender);
    if (req.query.educationLevel) query = query.eq('educationLevel', req.query.educationLevel);
    if (req.query.categoryIds) {
      const cats = (req.query.categoryIds as string).split(',');
      query = query.contains('categoryIds', cats);
    }

    const { data, error, count } = await query;
    if (error) return res.status(400).json(error);
    res.json({ data, count });
  });

  app.post('/api/beneficiaries', async (req: express.Request, res: express.Response) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
    const { data, error } = await supabase.from('beneficiaries').insert(req.body).select().single();
    if (error) return res.status(400).json(error);
    res.json(data);
  });

  app.put('/api/beneficiaries/:id', async (req: express.Request, res: express.Response) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
    const { data, error } = await supabase.from('beneficiaries').update(req.body).eq('id', req.params.id).select().single();
    if (error) return res.status(400).json(error);
    res.json(data);
  });

  app.delete('/api/beneficiaries/:id', async (req: express.Request, res: express.Response) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
    const { error } = await supabase.from('beneficiaries').delete().eq('id', req.params.id);
    if (error) return res.status(400).json(error);
    res.json({ success: true });
  });

  // Paginated Subscriptions
  app.get('/api/subscriptions/paginated', async (req: express.Request, res: express.Response) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
    
    const page = parseInt(req.query.page as string) || 0;
    const limit = parseInt(req.query.limit as string) || 20;
    const from = page * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('sponsor_subscriptions')
      .select('*, sponsors!inner(name, branchId)', { count: 'exact' })
      .range(from, to)
      .order('created_at', { ascending: false });

    if (req.query.branchId) {
      query = query.eq('sponsors.branchId', req.query.branchId);
    }
    if (req.query.sponsorId) {
      query = query.eq('sponsor_id', req.query.sponsorId);
    }
    if (req.query.searchTerm) {
      query = query.ilike('sponsors.name', `%${req.query.searchTerm}%`);
    }

    const { data, error, count } = await query;
    if (error) return res.status(400).json(error);
    res.json({ data, count });
  });

  //    User management using Supabase Auth Admin
  app.post('/api/users/create', async (req: express.Request, res: express.Response) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
    const { name, username, role, branchId } = req.body;
    const email = `${username}@gshr.local`;
    
    // Create user in Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: '123',
      email_confirm: true,
    });
    
    if (authError) return res.status(400).json(authError);
    if (!authData.user) return res.status(400).json({ message: 'User not created' });

    // Create profile
    const profile = {
      id: authData.user.id,
      name,
      username,
      role,
      branchId,
      isFirstLogin: true,
      password: '123'
    };
    const { error: profileError } = await supabase.from('user_profiles').upsert(profile);
    
    if (profileError) return res.status(400).json(profileError);
    res.json(profile);
  });

  app.post('/api/users/reset', async (req: express.Request, res: express.Response) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
    const { id } = req.body;
    
    // We try to update auth password but ignore if it fails
    await supabase.auth.admin.updateUserById(id, { password: '123' });
    
    const { error } = await supabase.from('user_profiles').update({ isFirstLogin: true, password: '123' }).eq('id', id);
    if (error) return res.status(400).json(error);
    
    res.json({ success: true });
  });

  // Custom auth login
  app.post('/api/auth/login', async (req: express.Request, res: express.Response) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
    const { username, password } = req.body;
    
    // Find profile by username
    const trimmedUsername = (username || '').trim();
    const { data: profile, error: profileError } = await supabase.from('user_profiles').select('*').eq('username', trimmedUsername).single();
    if (profileError || !profile) {
      console.error('Login error finding profile:', trimmedUsername, profileError);
      return res.status(401).json({ error: 'المستخدم غير موجود' });
    }
    
    // If we have a plain text password stored in user_profiles, check it directly.
    // This allows the initial admin user or users migrated with ADD COLUMN password to login.
    if (profile.password === password) {
      return res.json({ user: profile });
    }

    // Fallback: Verify the password through a standard Supabase sign in
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(profile.id);
    if (!userError && userData.user && userData.user.email) {
       const email = userData.user.email;
       const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
         email: email,
         password
       });
       
       if (!authError && authData.user) {
         return res.json({ user: profile });
       }
    }
    
    res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
  });

  app.post('/api/users/change-password', async (req: express.Request, res: express.Response) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
    const { id, password } = req.body;
    
    // Try to update Auth password if it exists
    await supabase.auth.admin.updateUserById(id, { password });
    
    const { error } = await supabase.from('user_profiles').update({ isFirstLogin: false, password }).eq('id', id);
    if (error) return res.status(400).json(error);
    
    res.json({ success: true });
  });

  app.delete('/api/users/:id', async (req: express.Request, res: express.Response) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
    const id = req.params.id as string;
    
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError) return res.status(400).json(authError);
    
    await supabase.from('user_profiles').delete().eq('id', id);
    res.json({ success: true });
  });

  // Generic fetch for all tables
  app.get('/api/:table', async (req: express.Request, res: express.Response) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
    const { table } = req.params;
    const { data, error } = await supabase.from(table as any).select('*');
    if (error) return res.status(400).json(error);
    res.json(data);
  });

  // Upsert for all tables
  app.post('/api/:table/upsert', async (req: express.Request, res: express.Response) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
    const { table } = req.params;
    const payload = req.body;
    const { data, error } = await supabase.from(table as any).upsert(payload);
    if (error) return res.status(400).json(error);
    res.json(data);
  });

  // Insert for logs
  app.post('/api/:table/insert', async (req: express.Request, res: express.Response) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
    const { table } = req.params;
    const payload = req.body;
    const { data, error } = await supabase.from(table as any).insert(payload);
    if (error) return res.status(400).json(error);
    res.json(data);
  });

  // Special route for print settings (single row)
  app.get('/api/settings/print', async (req: express.Request, res: express.Response) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
    const { data, error } = await supabase.from('print_settings').select('*').single();
    if (error && error.code !== 'PGRST116') return res.status(400).json(error);
    res.json(data);
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: express.Request, res: express.Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
