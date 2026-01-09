import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && supabaseAnonKey !== 'YOUR_ANON_KEY_HERE');
};

// Only create client if credentials are configured
let supabaseClient: SupabaseClient | null = null;

if (isSupabaseConfigured()) {
  supabaseClient = createClient(
    supabaseUrl!,
    supabaseAnonKey!,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    }
  );
} else {
  console.warn('Supabase credentials not configured. Cloud sync will be disabled.');
}

export const supabase = supabaseClient as SupabaseClient;
