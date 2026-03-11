// ============================================
// AUTH.JS - Authentication Module
// ============================================
// Flow: Signup → OTP Verify → Profile Setup → Homepage (all on index.html)
//       Login  → Homepage (if profile complete)
//       Login  → Profile Setup overlay on index.html (if incomplete)
// ============================================

// Note: window.supabase is the initialized client (set by supabase.js)

// Create authReadyPromise so any inline script can await window.authReadyPromise
window.authReadyPromise = new Promise(resolve => {
  window._resolveAuthReady = resolve;
});

/* ============================
   SIGN UP (Email + Password)
   Returns user object. Session will be null until OTP verified.
============================ */
async function signUpUser(email, password, name, dob) {
  // Build user metadata — full_name is used by the DB trigger on_auth_user_created
  // dob (date_of_birth) is stored in user_metadata for retrieval during profile setup
  const metadata = { full_name: name };
  if (dob) metadata.date_of_birth = dob; // format: YYYY-MM-DD

  const { data, error } = await window.supabase.auth.signUp({
    email,
    password,
    options: {
      // NO emailRedirectTo — we use OTP verification flow, not magic links
      data: metadata
    }
  });

  if (error) throw error;

  // Profile row is created by the DB trigger 'on_auth_user_created'.
  // After the user verifies their OTP, the profile setup step reads
  // dob from auth.users.raw_user_meta_data and writes it to profiles.date_of_birth.
  return data;
}

/* ============================
   AUTO ACCEPT TERMS (silent, called on signup Continue / Google SSO)
   The index page already shows "By clicking Continue, you agree to Terms, Privacy, Cookies"
   so consent is implicit and we update the DB record automatically.
   
   Uses direct fetch() to Supabase REST API — bypasses the service worker proxy.
   The proxy (window.supabase.from().update()) adds a 'content-profile' header that
   was missing from the Cloudflare Worker CORS allowlist, causing this call to fail silently.
   Direct fetch() with the session access_token works on ALL environments.
============================ */
async function autoAcceptTerms(userId) {
  try {
    // Get the current session token for authenticated REST call
    const { data: sessionData } = await window.supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;

    if (!accessToken) {
      console.warn('[Auth] autoAcceptTerms: no session token, skipping');
      return;
    }

    const SUPABASE_URL = 'https://ogqyemyrxogpnwitumsr.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ncXllbXlyeG9ncG53aXR1bXNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NTA4MDAsImV4cCI6MjA4NTAyNjgwMH0.cyWTrBkbKdrgrm31k5EgefdTBOsEeBaHjsD4NgGVjCM';

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${accessToken}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          terms_accepted: true,
          terms_accepted_at: new Date().toISOString()
        })
      }
    );

    if (!res.ok) {
      console.warn('[Auth] Terms auto-accept failed (non-critical): HTTP', res.status);
    } else {
      console.log('[Auth] ✅ Terms auto-accepted for user:', userId);
    }
  } catch (err) {
    console.warn('[Auth] Terms auto-accept exception (non-critical):', err.message);
  }
}


/* ============================
   VERIFY EMAIL OTP
   Called after user submits the 6-digit code we sent to their email.
============================ */
async function verifyEmailOtp(email, token) {
  const { data, error } = await window.supabase.auth.verifyOtp({
    email,
    token,
    type: 'email'   // 'email' type for signup email confirmation OTP
  });
  if (error) throw error;
  return data; // contains { session, user }
}

/* ============================
   RESEND SIGNUP OTP
============================ */
async function resendSignupOtp(email) {
  const { error } = await window.supabase.auth.resend({
    type: 'signup',
    email: email
  });
  if (error) throw error;
}

/* ============================
   SIGN IN (Email + Password)
============================ */
async function signInUser(email, password) {
  const { data, error } = await window.supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;

  // Check profile completion
  try {
    const { data: profile } = await window.supabase
      .from('profiles')
      .select('terms_accepted, profile_completed, username, full_name')
      .eq('id', data.user.id)
      .single();

    const isComplete = profile?.terms_accepted === true
      && profile?.profile_completed === true
      && profile?.username
      && profile?.full_name;

    data.user.onboardingRequired = !isComplete;
    data.user._profile = profile; // carry profile data for routing

    // Update last login (fire and forget)
    window.supabase.from('profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', data.user.id)
      .then(() => { })
      .catch(() => { });

  } catch (err) {
    console.error('[Auth] Profile check error:', err);
    data.user.onboardingRequired = true;
  }

  return data.user;
}

/* ============================
   LOGOUT
============================ */
async function signOutUser() {
  await window.supabase.auth.signOut();
  sessionStorage.clear();
  localStorage.removeItem('plusopinion_access');
}

/* ============================
   GET CURRENT USER
============================ */
async function getCurrentUser() {
  try {
    const { data: { session } } = await window.supabase.auth.getSession();
    if (session?.user) return session.user;
    const { data: { user } } = await window.supabase.auth.getUser();
    return user || null;
  } catch (err) {
    return null;
  }
}

/* ============================
   PROACTIVE SESSION REFRESH
   Keeps the token alive indefinitely — users stay logged in until
   they explicitly call signOutUser(). The Supabase client's built-in
   autoRefreshToken handles the actual token rotation; the heartbeat
   below is a safety net for long idle periods.

   ⚠️  IMPORTANT: Never call refreshSession() inside onAuthStateChange.
       refreshSession() fires a NEW onAuthStateChange(TokenRefreshed) event,
       which would call refreshSession() again → infinite loop that blocks
       every login attempt.
============================ */

// Track heartbeat so we can stop it on logout
let sessionHeartbeatInterval = null;

// onAuthStateChange only tracks sign-in / sign-out — NO refreshSession() calls here
window.supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    console.log('[Auth] ✅ Session active:', event);
    // Start the safety-net heartbeat if not already running
    if (!sessionHeartbeatInterval) startSessionHeartbeat();
  }

  if (event === 'SIGNED_OUT') {
    console.log('[Auth] 👋 User signed out — stopping heartbeat.');
    if (sessionHeartbeatInterval) {
      clearInterval(sessionHeartbeatInterval);
      sessionHeartbeatInterval = null;
    }
  }
});

// Safety-net heartbeat: every 15 minutes, check if the token is close to
// expiry and nudge Supabase to refresh it. This covers the case where the
// app has been open but idle for a long time (e.g. overnight on a desk).
// Supabase's autoRefreshToken already handles most cases — this is an extra
// layer so sessions survive very long idle periods.
async function startSessionHeartbeat() {
    if (sessionHeartbeatInterval) return; // already running

    sessionHeartbeatInterval = setInterval(async () => {
        try {
            const { data: { session } } = await window.supabase.auth.getSession();
            if (!session) {
                // Session gone — user was logged out elsewhere; clean up
                clearInterval(sessionHeartbeatInterval);
                sessionHeartbeatInterval = null;
                return;
            }
            // Only refresh if within 10 minutes of expiry (Supabase normally
            // refreshes at the 60-second mark; this catches edge cases)
            const expiresAt = session.expires_at
                ? new Date(session.expires_at * 1000).getTime()
                : 0;
            const msUntilExpiry = expiresAt - Date.now();
            if (msUntilExpiry > 0 && msUntilExpiry < 10 * 60 * 1000) {
                console.log('[Auth] Heartbeat: token expiring soon, refreshing...');
                await window.supabase.auth.refreshSession();
            }
        } catch (e) {
            console.warn('[Auth] Heartbeat refresh failed (non-critical):', e.message);
        }
    }, 15 * 60 * 1000); // every 15 minutes
}

// Kick off the heartbeat immediately if the user is already logged in
// (page reload / returning visitor path)
getCurrentUser().then(user => {
    if (user) startSessionHeartbeat();
});

/* ============================
   PASSWORD RESET
============================ */
async function resetPassword(email) {
  const redirectPath = '/reset-password.html';
  const redirectTo = window.location.origin + redirectPath;

  console.log(`[Auth] Requesting password reset for ${email}, redirect: ${redirectTo}`);

  const { error } = await window.supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectTo
  });

  if (error) {
    console.error('[Auth] Password reset request failed:', error);
    throw error;
  }
}

/* ============================
   GET / UPDATE PROFILE
============================ */
async function getUserProfileByUsername(username) {
  if (!username) return null;
  const cleanUsername = username.startsWith('@') ? username.substring(1) : username;

  try {
    const { data, error } = await window.supabase
      .from('profiles')
      .select('*')
      .eq('username', cleanUsername)
      .single();

    if (error || !data) return null;
    return data;
  } catch (err) {
    console.error('[Auth] Exception fetching profile by username:', err);
    return null;
  }
}
window.getUserProfileByUsername = getUserProfileByUsername;

async function getUserProfile(userId) {
  const { data, error } = await window.supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

async function updateUserProfile(userId, updates) {
  const { data, error } = await window.supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/* ============================
   UPLOAD AVATAR
============================ */
async function uploadAvatar(userId, file) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/avatar.${fileExt}`;

  const { error: uploadError } = await window.supabase.storage
    .from('Avatars')
    .upload(fileName, file, { upsert: true });
  if (uploadError) throw uploadError;

  const { data } = window.supabase.storage.from('Avatars').getPublicUrl(fileName);

  // Store RAW supabase.co URL in DB — rewriteMediaUrl applied at display time
  await updateUserProfile(userId, { avatar_url: data.publicUrl });

  const displayUrl = window.rewriteMediaUrl ? window.rewriteMediaUrl(data.publicUrl) : data.publicUrl;
  return displayUrl;
}

/* ============================
   CHECK USERNAME AVAILABILITY
============================ */
async function checkUsernameAvailable(username) {
  const { data, error } = await window.supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .maybeSingle();
  if (error) throw error;
  return !data;
}

/* ============================
   GOOGLE IDENTITY SERVICES
============================ */
const GOOGLE_CLIENT_ID = '409858133156-vho68t8ci9mob650b1lokl9drgqr2eih.apps.googleusercontent.com';

let gisInitialized = false;

function initGoogleIdentityServices() {
  if (document.getElementById('gsi-script')) return;

  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.id = 'gsi-script';
  script.async = true;
  script.defer = true;
  script.onload = () => {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredentialResponse,
      context: 'use',
      itp_support: true,
      cancel_on_tap_outside: false
    });
    gisInitialized = true;
    scanAndRenderGoogleButtons();
  };
  document.head.appendChild(script);
}

// Observe DOM to automatically render Google buttons when modals mount
const observer = new MutationObserver(() => {
  if (gisInitialized) scanAndRenderGoogleButtons();
});
if (document.body) {
  observer.observe(document.body, { childList: true, subtree: true });
} else {
  document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, { childList: true, subtree: true });
  });
}

function scanAndRenderGoogleButtons() {
  if (!gisInitialized || !window.google) return;

  const containers = document.querySelectorAll('.google-sso-container:not([data-rendered="true"])');
  containers.forEach(el => {
    const action = el.dataset.action || 'signin';
    el.style.width = '100%';
    el.style.display = 'flex';
    el.style.justifyContent = 'center';

    window.google.accounts.id.renderButton(el, {
      theme: 'filled_black',
      size: 'large',
      type: 'standard',
      shape: 'pill',
      text: action === 'signup' ? 'signup_with' : 'signin_with',
      width: 320
    });
    el.dataset.rendered = 'true';
  });
}

async function handleGoogleCredentialResponse(response) {
  // Show loading overlay
  let loadingDiv = document.getElementById('google-auth-loader');
  if (!loadingDiv) {
    loadingDiv = document.createElement('div');
    loadingDiv.id = 'google-auth-loader';
    loadingDiv.innerHTML = '<div style="position:fixed;inset:0;background:rgba(2,4,8,0.92);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;font-family:Inter,sans-serif;backdrop-filter:blur(12px);"><div style="width:44px;height:44px;border:3px solid rgba(255,255,255,0.08);border-top-color:#2F8BFF;border-radius:50%;animation:gSpinner 0.9s linear infinite;"></div><p style="margin-top:18px;font-size:15px;font-weight:500;color:rgba(255,255,255,0.7);">Signing in...</p><style>@keyframes gSpinner{to{transform:rotate(360deg)}}</style></div>';
    document.body.appendChild(loadingDiv);
  }

  try {
    console.log('[Auth] Google credential received, authenticating with Supabase...');

    const { data, error } = await window.supabase.auth.signInWithIdToken({
      provider: 'google',
      token: response.credential
    });

    if (error) throw error;

    if (!data || !data.user || !data.user.id) {
      throw new Error('No user returned from Supabase ID token exchange.');
    }

    // Check if user has a complete profile
    let isComplete = false;
    let profileData = null;
    try {
      const { data: profile, error: profileError } = await window.supabase
        .from('profiles')
        .select('profile_completed, terms_accepted, username, full_name')
        .eq('id', data.user.id)
        .single();

      profileData = profile;

      if (!profileError && profile?.profile_completed && profile?.terms_accepted && profile?.username && profile?.full_name) {
        isComplete = true;
      }
    } catch (profileErr) {
      console.warn('[Auth] Profile check exception (will show profile setup):', profileErr);
    }

    if (isComplete) {
      // Existing complete user → go straight to homepage
      console.log('[Auth] ✅ Google user complete → HOMEPAGE_FINAL.HTML');
      window.location.href = window.location.origin + '/HOMEPAGE_FINAL.HTML';
    } else {
      // New or incomplete user → auto-accept terms, then show profile setup
      console.log('[Auth] 🆕 Google user needs profile setup → index.html profile overlay');
      await autoAcceptTerms(data.user.id);

      // Remove loader first
      if (loadingDiv) loadingDiv.remove();

      // Fire event — index.html listens for this to show the profile completion overlay
      window.dispatchEvent(new CustomEvent('auth:profileSetupRequired', {
        detail: { user: data.user }
      }));
    }
  } catch (err) {
    console.error('[Auth] Google Sign-In Error:', err);
    // Remove loader
    if (loadingDiv) loadingDiv.remove();
    // Show error in the page context
    if (window.showAuthError) {
      window.showAuthError('Google Sign-In failed: ' + (err.message || 'Unknown error'));
    } else {
      alert('Google Sign-In failed: ' + (err.message || 'Unknown error'));
    }
  }
}

// Kick off GIS loading immediately
initGoogleIdentityServices();

// Backwards compatibility stub
async function signInWithProvider(provider) {
  if (provider === 'google') {
    if (gisInitialized) {
      window.google.accounts.id.prompt();
    } else {
      alert('Google Sign-In is initializing. Please wait a moment and try again.');
    }
  }
}

/* ============================
   EXPOSE TO BROWSER
============================ */
window.signUpUser = signUpUser;
window.signInUser = signInUser;
window.signInWithProvider = signInWithProvider;
window.signOutUser = signOutUser;
window.getCurrentUser = getCurrentUser;
window.resetPassword = resetPassword;
window.getUserProfile = getUserProfile;
window.updateUserProfile = updateUserProfile;
window.uploadAvatar = uploadAvatar;
window.checkUsernameAvailable = checkUsernameAvailable;
window.autoAcceptTerms = autoAcceptTerms;
window.verifyEmailOtp = verifyEmailOtp;
window.resendSignupOtp = resendSignupOtp;
window.initGoogleIdentityServices = initGoogleIdentityServices;
window.scanAndRenderGoogleButtons = scanAndRenderGoogleButtons;

// Mark auth module as ready
window.authReady = true;
if (window._resolveAuthReady) {
  window._resolveAuthReady();
}

console.log('✅ Auth module loaded (OTP flow enabled)');
