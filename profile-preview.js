/**
 * API Route: /profile/:username
 *
 * Bot Detection Pattern (same as YouTube, X, Instagram):
 * - Crawlers → pure OG HTML (no redirect) → rich preview card generates
 * - Real users → immediate JS redirect → lands in the app
 */

const SOCIAL_CRAWLERS = [
    'whatsapp',
    'telegram',
    'twitterbot',
    'facebookexternalhit',
    'facebot',
    'linkedinbot',
    'slackbot',
    'discordbot',
    'skype',
    'googlebot',
    'bingbot',
    'iframely',
    'embedly',
    'outbrain',
    'vkshare',
    'w3c_validator',
    'curl',
    'wget',
    'python-requests',
    'axios',
    'preview'
];

function isCrawler(userAgent = '') {
    const ua = userAgent.toLowerCase();
    return SOCIAL_CRAWLERS.some(bot => ua.includes(bot));
}

export default async function handler(req, res) {
    const { username } = req.query;
    const userAgent = req.headers['user-agent'] || '';

    if (!username) {
        return res.redirect('/HOMEPAGE_FINAL.HTML');
    }

    try {
        const SUPABASE_URL = "https://ogqyemyrxogpnwitumsr.supabase.co";
        const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ncXllbXlyeG9ncG53aXR1bXNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NTA4MDAsImV4cCI6MjA4NTAyNjgwMH0.cyWTrBkbKdrgrm31k5EgefdTBOsEeBaHjsD4NgGVjCM";

        const apiUrl = `${SUPABASE_URL}/rest/v1/profiles?username=eq.${encodeURIComponent(username)}&select=full_name,username,avatar_url,rqs_score,bio,is_verified`;

        const response = await fetch(apiUrl, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) throw new Error(`Supabase error: ${response.statusText}`);

        const profiles = await response.json();
        const profile = profiles[0];

        if (!profile) {
            return res.redirect('/HOMEPAGE_FINAL.HTML');
        }

        // --- BUILD METADATA ---
        const fullName = profile.full_name || 'PlusOpinion User';
        const rqs = profile.rqs_score || 0;
        const safeBio = (profile.bio || '')
            .replace(/[\r\n]+/g, ' ')
            .replace(/[<>"&]/g, c => ({ '<': '&lt;', '>': '&gt;', '"': '&quot;', '&': '&amp;' }[c]))
            .substring(0, 200);

        const title = `${fullName} (@${username}) · RQS ${rqs} on PlusOpinion`;
        const description = safeBio
            ? `${safeBio} · Follow @${username} on PlusOpinion`
            : `See @${username}'s opinions, reviews and RQS score on PlusOpinion`;

        const image = profile.avatar_url || 'https://plusopinion.com/icon-512.png';
        const canonicalUrl = `https://plusopinion.com/profile/${username}`;
        // Use the clean /profile path so Cloudflare _redirects maps it correctly to the physical file.
        // IMPORTANT: Do NOT use the physical filename with spaces - Cloudflare may fail to serve it directly.
        const appUrl = `/profile?username=${encodeURIComponent(username)}`;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');

        const isBot = isCrawler(userAgent);
        console.log(`[profile-preview] username=${username} | bot=${isBot} | ua=${userAgent.substring(0, 80)}`);

        if (isBot) {
            // ===================================================
            // CRAWLER PATH: Pure OG tags, no redirect.
            // WhatsApp/Telegram will generate a rich profile card.
            // ===================================================
            return res.status(200).send(`<!DOCTYPE html>
<html prefix="og: https://ogp.me/ns#" lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
    <meta name="description" content="${description}">

    <!-- Open Graph -->
    <meta property="og:type" content="profile">
    <meta property="og:site_name" content="PlusOpinion">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${image}">
    <meta property="og:image:width" content="400">
    <meta property="og:image:height" content="400">
    <meta property="og:locale" content="en_US">
    <meta property="profile:username" content="${username}">
    <meta property="profile:first_name" content="${fullName.split(' ')[0]}">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary">
    <meta name="twitter:site" content="@plusopinion">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${image}">
    <meta name="twitter:url" content="${canonicalUrl}">

    <link rel="canonical" href="${canonicalUrl}">
</head>
<body>
    <p>Loading PlusOpinion profile...</p>
</body>
</html>`);
        } else {
            // ===================================================
            // USER PATH: Show loading screen, redirect to profile.
            // ===================================================
            return res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
    <meta name="description" content="${description}">
    <meta property="og:type" content="profile">
    <meta property="og:site_name" content="PlusOpinion">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${image}">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${image}">
    <link rel="canonical" href="${canonicalUrl}">
    <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{background:#020205;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:16px}
        .avatar{width:72px;height:72px;border-radius:50%;border:2px solid rgba(255,255,255,0.15);object-fit:cover;margin-bottom:8px}
        h2{font-size:18px;font-weight:700;letter-spacing:-0.5px}
        p{font-size:13px;color:rgba(255,255,255,0.5)}
        .rqs{background:rgba(47,139,255,0.15);border:1px solid rgba(47,139,255,0.3);color:#2f8bff;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700}
        .bar{width:200px;height:3px;background:rgba(255,255,255,0.1);border-radius:2px;overflow:hidden;margin-top:8px}
        .bar-fill{height:100%;background:linear-gradient(90deg,#2f8bff,#6BFFB6);border-radius:2px;animation:load 0.8s ease-out forwards}
        @keyframes load{from{width:0}to{width:100%}}
    </style>
    <script>window.location.replace("${appUrl}");</script>
</head>
<body>
    <img class="avatar" src="${image}" alt="${fullName}" onerror="this.src='https://plusopinion.com/icon-192.png'">
    <h2>${fullName}</h2>
    <div class="rqs">RQS ${rqs}</div>
    <p>Opening profile on PlusOpinion...</p>
    <div class="bar"><div class="bar-fill"></div></div>
</body>
</html>`);
        }

    } catch (error) {
        console.error('[profile-preview] Error:', error.message);
        return res.redirect('/HOMEPAGE_FINAL.HTML');
    }
}
