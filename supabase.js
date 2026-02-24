// Supabase client will be initialized from the UMD bundle loaded via script tag
// This avoids the ESM import issue with node:module dependencies

const SUPABASE_URL = "https://ogqyemyrxogpnwitumsr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ncXllbXlyeG9ncG53aXR1bXNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NTA4MDAsImV4cCI6MjA4NTAyNjgwMH0.cyWTrBkbKdrgrm31k5EgefdTBOsEeBaHjsD4NgGVjCM";

// Wait for Supabase UMD to load, then create client
function initializeSupabase() {
  if (!window.supabase) {
    // Supabase UMD library not loaded - initialization failed
    return null;
  }

  const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,        // Enable session persistence across browser restarts
        autoRefreshToken: true,      // Automatically refresh tokens before expiry
        detectSessionInUrl: true,    // Handle OAuth callbacks and magic links
        storage: window.localStorage // Use localStorage (survives browser close, unlike sessionStorage)
      }
    }
  );

  // Expose to browser window for global access
  window.supabase = supabase;
  return supabase;
}

// Initialize when script loads (sets window.supabase globally — no export needed)
initializeSupabase();
