// ============================================
// AUTH.JS - Simple Authentication Module
// ============================================
// Flow: Signup → Onboarding → Homepage
//       Login  → Homepage (if onboarding done)
//       Login  → Onboarding (if onboarding not done)
// ============================================

// Note: window.supabase is the initialized client (set by supabase.js)
// We reference it via window.supabase directly (not cached) to handle async module loading

// Create authReadyPromise so any inline script can await window.authReadyPromise
window.authReadyPromise = new Promise(resolve => {
  window._resolveAuthReady = resolve;
});
/* ============================
   SIGN UP (Email + Password)
============================ */
async function signUpUser(email, password, name, dob) {
  const redirectPath = '/onboarding.html'; // FORCE .html extension

  // Build user metadata — full_name is used by the DB trigger on_auth_user_created
  // dob (date_of_birth) is stored in user_metadata for retrieval during onboarding
  const metadata = { full_name: name };
  if (dob) metadata.date_of_birth = dob; // format: YYYY-MM-DD

  const { data, error } = await window.supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin + redirectPath,
      data: metadata
    }
  });

  if (error) throw error;

  // Profile row is created by the DB trigger 'on_auth_user_created'.
  // After the user verifies email and lands on onboarding, the onboarding
  // flow should read dob from auth.users.raw_user_meta_data and write it
  // to profiles.date_of_birth if not already set.
  return data;
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

  // Simple onboarding check
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

    // Update last login
    window.supabase.from('profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', data.user.id)
      .then(() => { })
      .catch(() => { });

  } catch (err) {
    console.error('Profile check error:', err);
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
    // 1. Check local session first (silent, no network/error noise)
    const { data: { session } } = await window.supabase.auth.getSession();
    if (session?.user) return session.user;

    // 2. Only if session exists in storage but user object is missing, 
    // try getUser() to verify/refresh (might throw if session expired)
    const { data: { user } } = await window.supabase.auth.getUser();
    return user || null;
  } catch (err) {
    // Silence all errors including AuthSessionMissingError
    return null;
  }
}

/* ============================
   PASSWORD RESET
============================ */
async function resetPassword(email) {
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.endsWith('.local');

  // FORCE .html extension for reliability
  const redirectPath = '/reset-password.html';
  const redirectTo = window.location.origin + redirectPath;

  console.log(`[Auth] Requesting password reset for ${email}`);
  console.log(`[Auth] Redirect URL: ${redirectTo} (isLocalhost: ${isLocalhost})`);

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
    console.error('Exception fetching profile by username:', err);
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
  // FIX #3: Rewrite to proxy URL so avatar loads even if ISP blocks supabase.co
  const finalUrl = window.rewriteMediaUrl ? window.rewriteMediaUrl(data.publicUrl) : data.publicUrl;
  await updateUserProfile(userId, { avatar_url: finalUrl });
  return finalUrl;
}

/* ============================
   CHECK USERNAME
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
// Switch from Server OAuth to Client-Side GIS to bypass ISP blocking of .supabase.co callbacks
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

// Observe DOM to automatically render buttons when React modals mount
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
    // Make wrapper full width for the button
    el.style.width = '100%';
    el.style.display = 'flex';
    el.style.justifyContent = 'center';

    window.google.accounts.id.renderButton(el, {
      theme: 'filled_black',
      size: 'large',
      type: 'standard',
      shape: 'pill',
      text: action === 'signup' ? 'signup_with' : 'signin_with',
      width: 320 // Good default width matching original design
    });
    el.dataset.rendered = 'true';
  });
}

async function handleGoogleCredentialResponse(response) {
  try {
    console.log("GIS Token received. Authenticating with Supabase...");
    // Show simple loading UI
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'google-auth-loader';
    loadingDiv.innerHTML = '<div style="position:fixed;inset:0;background:rgba(2,4,8,0.9);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;font-family:sans-serif;backdrop-filter:blur(8px);"><div style="width:40px;height:40px;border:3px solid rgba(255,255,255,0.1);border-top-color:#3b82f6;border-radius:50%;animation:spin 1s linear infinite;"></div><h3 style="margin-top:20px;font-weight:600;">Authenticating...</h3><style>@keyframes spin { to { transform: rotate(360deg); } }</style></div>';
    document.body.appendChild(loadingDiv);

    const { data, error } = await window.supabase.auth.signInWithIdToken({
      provider: 'google',
      token: response.credential
    });

    console.log("Supabase Auth Response:", { data, error });

    if (error) throw error;

    // Safety check - make sure we actually got a user object back
    if (!data || !data.user || !data.user.id) {
      throw new Error("No user returned from Supabase ID token exchange.");
    }

    // Check if user has already completed onboarding
    // We gracefully fallback to onboarding if this query fails
    let isComplete = false;
    try {
      console.log("Checking profile status for user:", data.user.id);
      const { data: profile, error: profileError } = await window.supabase
        .from('profiles')
        .select('profile_completed, terms_accepted, username, full_name')
        .eq('id', data.user.id)
        .single();

      console.log("Profile data retrieved:", profile);

      if (profileError) {
        console.warn("Profile fetch returned error (expected for brand new users):", profileError.message);
      }

      if (profile && profile.profile_completed && profile.terms_accepted && profile.username && profile.full_name) {
        isComplete = true;
      }
    } catch (profileErr) {
      console.log('Profile check exception (routing to onboarding):', profileErr);
    }

    console.log("Routing to:", isComplete ? "HOMEPAGE_FINAL.HTML" : "onboarding.html");

    if (isComplete) {
      window.location.href = window.location.origin + '/HOMEPAGE_FINAL.HTML';
    } else {
      window.location.href = window.location.origin + '/onboarding.html';
    }
  } catch (err) {
    console.error('Google Sign-In Error caught in catch block:', err);
    alert('Google Sign-In failed: ' + (err.message || 'Unknown error'));
    const loader = document.getElementById('google-auth-loader');
    if (loader) loader.remove();
  }
}

// Kick off GIS loading immediately
initGoogleIdentityServices();

// Keep stub for backwards compatibility during migration
async function signInWithProvider(provider) {
  if (provider === 'google') {
    if (gisInitialized) {
      window.google.accounts.id.prompt(); // Show One Tap
    } else {
      alert("Google Sign-In is initializing. Please wait a second and try again.");
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
// Expose Google Identity Services helpers for pages that need to trigger re-scan
window.initGoogleIdentityServices = initGoogleIdentityServices;
window.scanAndRenderGoogleButtons = scanAndRenderGoogleButtons;

// Mark auth module as ready
window.authReady = true;
if (window._resolveAuthReady) {
  window._resolveAuthReady();
}

console.log('✅ Auth functions loaded');
