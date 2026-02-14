// Use the Supabase client initialized from the UMD bundle
// The supabase.js module script initializes window.supabase
const supabase = window.supabase;

/* ============================
   SIGN UP (Email + Pasword)
============================ */
/* ============================
   SIGN UP (Email + Pasword)
============================ */
async function signUpUser(email, password, name) {

  // Fix: Environment-aware redirect
  // Localhost needs physical file (no _redirects support)
  // Production uses clean URL (/feed)
  const isLocalhost = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';
  const redirectPath = isLocalhost ? '/HOMEPAGE_FINAL.HTML' : '/feed';

  // 1. Create auth user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin + redirectPath,
      data: {
        full_name: name
      }
    }
  });

  if (error) throw error;

  const user = data.user;

  // 2. Store extra data in profiles table (optional - won't fail if table doesn't exist)
  if (user) {
    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email,
          full_name: name
        });

      // Log profile error but don't throw - signup should still succeed
      if (profileError) {
        console.warn('Profile creation skipped:', profileError.message);
      }
    } catch (profileError) {
      // Silently handle profile creation errors
      console.warn('Profile table not available:', profileError);
    }
  }

  return user;
}

/* ============================
   SIGN IN (Email + Password)
============================ */
async function signInUser(email, password, disableAutoRedirect = false) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;

  // 🔒 MANDATORY ONBOARDING CHECK
  let onboardingRequired = false;

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('terms_accepted, profile_completed, username, full_name, last_login_at, created_at')
      .eq('id', data.user.id)
      .single();

    // Check if onboarding is complete
    const onboardingComplete = profile?.terms_accepted === true
      && profile?.profile_completed === true
      && profile?.username !== null
      && profile?.username !== ''
      && profile?.full_name !== null
      && profile?.full_name !== '';

    if (!onboardingComplete) {
      onboardingRequired = true;

      // Only redirect if NOT disabled
      if (!disableAutoRedirect) {
        setTimeout(() => {
          window.navigateTo('onboarding.html');
        }, 100);
      }
    } else {
      // Onboarding IS complete

      // Send welcome back notification for returning users
      if (profile?.last_login_at && window.notifyWelcomeBack) {
        const accountAge = (new Date() - new Date(profile.created_at)) / (1000 * 60 * 60);

        // Only send if account is at least 1 hour old (not a brand new signup)
        if (accountAge > 1) {
          window.notifyWelcomeBack(data.user.id, profile.full_name, profile.last_login_at)
            .catch(err => console.error('Failed to send welcome back notification:', err));
        }
      }

      // Update last login timestamp
      supabase.from('profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', data.user.id)
        .then(() => { })
        .catch(err => console.error('Failed to update last_login_at:', err));
    }

  } catch (err) {
    console.error('Error checking onboarding status:', err);
    // On error, assume onboarding is needed to be safe
    onboardingRequired = true;

    if (!disableAutoRedirect) {
      setTimeout(() => {
        window.navigateTo('onboarding.html');
      }, 100);
    }
  }

  // Attach status to returned user object for caller convenience
  data.user.onboardingRequired = onboardingRequired;
  return data.user;
}


/* ============================
   LOGOUT
============================ */
async function signOutUser() {
  // Sign out from Supabase (clears auth tokens from localStorage)
  await supabase.auth.signOut();

  // Clear any custom storage for complete cleanup
  sessionStorage.clear();

  // Remove any legacy access flags if they exist
  localStorage.removeItem('plusopinion_access');
}

/* ============================
   GET CURRENT USER
============================ */
async function getCurrentUser() {
  // 1. First try session (this is instant if already logged in)
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData?.session?.user) {
    return sessionData.session.user;
  }

  // 2. Fallback to getUser (network)
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}

/* ============================
   PASSWORD RESET (Magic Link)
============================ */
async function resetPassword(email) {
  // Fix: Environment-aware redirect
  // Use production URL in production, localhost physical file in development
  const isLocalhost = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  const redirectPath = isLocalhost ? '/reset-password.html' : '/reset-password';
  const redirectUrl = window.location.origin + redirectPath;

  console.log('🔐 Sending password reset email to:', email);
  console.log('📧 Reset redirect URL:', redirectUrl);
  console.log('🌍 Environment:', isLocalhost ? 'localhost' : 'production');

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl
  });

  if (error) {
    console.error('❌ Password reset error:', error);
    throw error;
  }

  console.log('✅ Password reset email sent successfully');
}

/* ============================
   GET USER PROFILE
============================ */
async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

/* ============================
   UPDATE USER PROFILE
============================ */
async function updateUserProfile(userId, updates) {
  const { data, error } = await supabase
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

  // Upload file to storage
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { upsert: true });

  if (uploadError) throw uploadError;

  // Get public URL
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);

  // Update profile with avatar URL
  await updateUserProfile(userId, { avatar_url: data.publicUrl });

  return data.publicUrl;
}

/* ============================
   CHECK USERNAME AVAILABILITY
============================ */
async function checkUsernameAvailable(username) {
  const { data, error } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .maybeSingle();

  if (error) throw error;
  return !data; // Returns true if available
}

/* ============================
   SIGN IN WITH PROVIDER (Google/Facebook)
============================ */
async function signInWithProvider(provider) {

  try {
    // Fix: Environment-aware redirect
    const isLocalhost = window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';
    const redirectPath = isLocalhost ? '/HOMEPAGE_FINAL.HTML' : '/feed';

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        // Automatically redirects to /feed on whatever domain the user is currently on
        redirectTo: window.location.origin + redirectPath
      }
    });

    if (error) {
      console.error('❌ Supabase OAuth Error:', error);
      alert(`Login Error: ${error.message}`);
      throw error;
    }


    return data;
  } catch (err) {
    console.error('❌ Unexpected OAuth Error:', err);
    alert(`Unexpected Login Error: ${err.message}`);
    throw err;
  }
}

/* ============================
   EXPOSE TO BROWSER
============================ */
window.signUpUser = signUpUser;
window.signInUser = signInUser;
window.signInWithProvider = signInWithProvider; // NEW
window.signOutUser = signOutUser;
window.getCurrentUser = getCurrentUser;
window.resetPassword = resetPassword;
window.getUserProfile = getUserProfile;
window.updateUserProfile = updateUserProfile;
window.uploadAvatar = uploadAvatar;
window.checkUsernameAvailable = checkUsernameAvailable;

// Mark auth module as ready (prevents timeout errors on mobile)
window.authReady = true;
if (window._resolveAuthReady) {
  window._resolveAuthReady();
}
// Auth module loaded successfully
