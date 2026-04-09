import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';

// Supabase Configuration (Server-side only)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('CRITICAL: Supabase environment variables are missing!');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // --- API Routes ---

  // Generic fetch for all tables
  app.get('/api/:table', async (req: express.Request, res: express.Response) => {
    const { table } = req.params;
    const { data, error } = await supabase.from(table as any).select('*');
    if (error) return res.status(400).json(error);
    res.json(data);
  });

  // Upsert for all tables
  app.post('/api/:table/upsert', async (req: express.Request, res: express.Response) => {
    const { table } = req.params;
    const payload = req.body;
    const { data, error } = await supabase.from(table as any).upsert(payload);
    if (error) return res.status(400).json(error);
    res.json(data);
  });

  // Insert for logs
  app.post('/api/:table/insert', async (req: express.Request, res: express.Response) => {
    const { table } = req.params;
    const payload = req.body;
    const { data, error } = await supabase.from(table as any).insert(payload);
    if (error) return res.status(400).json(error);
    res.json(data);
  });

  // Special route for print settings (single row)
  app.get('/api/settings/print', async (req: express.Request, res: express.Response) => {
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
