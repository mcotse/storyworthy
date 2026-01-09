import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabasePublishableKey && supabasePublishableKey !== 'YOUR_PUBLISHABLE_KEY_HERE');
};

// Only create client if credentials are configured
let supabaseClient: SupabaseClient | null = null;

if (isSupabaseConfigured()) {
  supabaseClient = createClient(
    supabaseUrl!,
    supabasePublishableKey!,
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
