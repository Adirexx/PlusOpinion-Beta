/**
 * API Route: /profile/:username
 * 
 * This server-side function generates dynamic Open Graph (OG) tags
 * for user profile previews and then redirects the real user to the profile page.
 */

export default async function handler(req, res) {
    const { username } = req.query;

    if (!username) {
        return res.redirect('/feed');
    }

    try {
        const SUPABASE_URL = "https://ogqyemyrxogpnwitumsr.supabase.co";
        const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ncXllbXlyeG9ncG53aXR1bXNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NTA4MDAsImV4cCI6MjA4NTAyNjgwMH0.cyWTrBkbKdrgrm31k5EgefdTBOsEeBaHjsD4NgGVjCM";

        // Fetch profile data
        const apiUrl = `${SUPABASE_URL}/rest/v1/profiles?username=eq.${username}&select=*`;

        const response = await fetch(apiUrl, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error(`Supabase error: ${response.statusText}`);
        }

        const profiles = await response.json();
        const profile = profiles[0];

        if (!profile) {
            return res.redirect('/feed');
        }

        const fullName = profile.full_name || 'PlusOpinion User';
        const rqs = profile.rqs_score || 0;
        const bio = profile.bio || `Check out ${fullName}'s profile on PlusOpinion. RQS Score: ${rqs}`;
        const title = `${fullName} (@${username}) | RQS ${rqs}`;
        const image = profile.avatar_url || 'https://plusopinion.com/icon-512.png';
        const url = `https://plusopinion.com/profile/${username}`;

        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    
    <meta name="description" content="${bio}">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="profile">
    <meta property="og:url" content="${url}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${bio}">
    <meta property="og:image" content="${image}">
    <meta property="og:site_name" content="PlusOpinion">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary">
    <meta name="twitter:url" content="${url}">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${bio}">
    <meta name="twitter:image" content="${image}">

    <link rel="canonical" href="${url}">

    <meta http-equiv="refresh" content="0;url=/PUBLIC%20POV%20PROFILE.HTML?username=${username}">
    <script>
        window.location.replace("/PUBLIC%20POV%20PROFILE.HTML?username=${username}");
    </script>
</head>
<body style="background: #020205; color: white; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
    <div style="text-align: center;">
        <img src="/icon-192.png" width="80" height="80" style="margin-bottom: 20px; border-radius: 20px;">
        <h2>Opening Profile...</h2>
        <p style="color: rgba(255,255,255,0.6)">Redirecting you to PlusOpinion</p>
    </div>
</body>
</html>`);

    } catch (error) {
        console.error('Profile preview error:', error);
        return res.redirect('/feed');
    }
}
