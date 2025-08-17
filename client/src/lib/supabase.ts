import { createClient } from '@supabase/supabase-js';

const url = (import.meta as unknown as { env: { VITE_SUPABASE_URL?: string } }).env.VITE_SUPABASE_URL;
const anon = (import.meta as unknown as { env: { VITE_SUPABASE_ANON_KEY?: string } }).env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(url ?? '', anon ?? '');




