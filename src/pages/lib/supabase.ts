import { createClient } from '@supabase/supabase-js';

// Singleton — una sola instancia para todo el servidor
let instance: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!instance) {
    instance = createClient(
      import.meta.env.SUPABASE_URL,
      import.meta.env.SUPABASE_KEY
    );
  }
  return instance;
}