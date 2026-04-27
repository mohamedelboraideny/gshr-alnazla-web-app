import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function run() {
  const { data: bData, error: bError } = await supabase.from('branches').select('*');
  console.log('Branches:', bData, bError);

  const { data: sData, error: sError } = await supabase.from('sponsors').select('*');
  console.log('Sponsors:', sData, sError);
}
run();
