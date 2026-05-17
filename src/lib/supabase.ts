import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project') || supabaseAnonKey.includes('your-anon-key')) {
  console.error('❌ Supabase credentials missing! Please check your .env file.');
  // We throw a clear error that can be caught by App.tsx
  if (typeof window !== 'undefined') {
    (window as any).__SUPABASE_CONFIG_ERROR__ = "Supabase URL oder Anon Key fehlt. Bitte erstelle eine .env Datei.";
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);
