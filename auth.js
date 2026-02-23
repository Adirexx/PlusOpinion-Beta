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
async function signUpUser(email, password, name) {
  const redirectPath = '/onboarding.html'; // FORCE .html extension

  const { data, error } = await window.supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin + redirectPath,
      data: { full_name: name }
    }
  });

  if (error) throw error;

  // Profile creation is handled by database trigger 'on_auth_user_created'
  // No need to manually create profile here

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
  // FORCE .html extension
  const redirectPath = '/reset-password.html';

  const { error } = await window.supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + redirectPath
  });

  if (error) throw error;
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
  await updateUserProfile(userId, { avatar_url: data.publicUrl });
  return data.publicUrl;
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
   GOOGLE / OAUTH SIGN IN
============================ */
async function signInWithProvider(provider) {
  const redirectPath = '/onboarding.html'; // FORCE .html extension

  const { data, error } = await window.supabase.auth.signInWithOAuth({
    provider: provider,
    options: {
      redirectTo: window.location.origin + redirectPath
    }
  });

  if (error) throw error;
  return data;
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

// Mark auth module as ready
window.authReady = true;
if (window._resolveAuthReady) {
  window._resolveAuthReady();
}

console.log('✅ Auth functions loaded');
