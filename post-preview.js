/**
 * API Route: /post/:id
 *
 * HOW SOCIAL PREVIEWS WORK (like Twitter/YouTube/Instagram):
 * - Social platforms send a "crawler bot" to read your URL before showing a preview card.
 * - The bot reads Open Graph (og:title, og:image etc.) meta tags in the <head>.
 * - If you redirect before the bot reads those tags, it follows the redirect and loses them.
 *
 * SOLUTION (Bot Detection Pattern):x
 * 1. Read the User-Agent from the incoming request.
 * 2. If it's a known social crawler → serve pure OG HTML, NO redirect.
 * 3. If it's a real user → redirect them instantly to the app.
 */

// All major social/messaging crawler User-Agent strings
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
    const { id } = req.query;
    const userAgent = req.headers['user-agent'] || '';

    if (!id) {
        return res.redirect('/HOMEPAGE_FINAL.HTML');
    }

    // --- FETCH POST DATA ---
    try {
        const SUPABASE_URL = "https://ogqyemyrxogpnwitumsr.supabase.co";
        const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ncXllbXlyeG9ncG53aXR1bXNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NTA4MDAsImV4cCI6MjA4NTAyNjgwMH0.cyWTrBkbKdrgrm31k5EgefdTBOsEeBaHjsD4NgGVjCM";

        const apiUrl = `${SUPABASE_URL}/rest/v1/posts?id=eq.${encodeURIComponent(id)}&select=*,profiles:user_id(username,full_name,avatar_url,rqs_score)`;

        const response = await fetch(apiUrl, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) throw new Error(`Supabase error: ${response.statusText}`);

        const posts = await response.json();
        const post = posts[0];

        if (!post) {
            return res.redirect('/HOMEPAGE_FINAL.HTML');
        }

        // --- BUILD METADATA ---
        const username = post.profiles?.username || 'user';
        const fullName = post.profiles?.full_name || 'PlusOpinion User';
        const postText = post.text_content || '';
        const rqs = post.profiles?.rqs_score || 0;
        const isVerified = post.is_verified_purchase === true;

        // Safe text — strip HTML/newlines/quotes for meta attributes
        const safeText = postText
            .replace(/[\r\n]+/g, ' ')
            .replace(/[<>"&]/g, c => ({ '<': '&lt;', '>': '&gt;', '"': '&quot;', '&': '&amp;' }[c]))
            .substring(0, 200);

        const description = safeText ? `"${safeText}..." · ${isVerified ? '✅ Verified Purchase · ' : ''}Read full opinion on PlusOpinion` : `See what ${fullName} thinks on PlusOpinion`;
        const title = `${fullName} (@${username}) · RQS ${rqs} on PlusOpinion`;

        // Prioritise post image > author avatar > fallback logo
        const image = (post.media_url && !post.media_url.includes('video'))
            ? post.media_url
            : (post.profiles?.avatar_url || 'https://plusopinion.com/icon-512.png');

        const canonicalUrl = `https://plusopinion.com/post/${id}`;
        const appUrl = `/HOMEPAGE_FINAL.HTML?post=${id}`;

        // --- RESPONSE HEADERS (no caching for fresh content) ---
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');

        const isBot = isCrawler(userAgent);
        console.log(`[post-preview] id=${id} | bot=${isBot} | ua=${userAgent.substring(0, 80)}`);

        if (isBot) {
            // ===================================================
            // CRAWLER PATH: Pure OG tag page — NO redirect at all.
            // WhatsApp/Telegram/Twitter read these tags and
            // generate the rich preview card. This is correct.
            // ===================================================
            return res.status(200).send(`<!DOCTYPE html>
<html prefix="og: https://ogp.me/ns#" lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
    <meta name="description" content="${description}">

    <!-- Open Graph (WhatsApp, Facebook, Telegram, Discord, Slack, iMessage) -->
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="PlusOpinion">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${image}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:locale" content="en_US">

    <!-- Twitter Card (X.com) -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@plusopinion">
    <meta name="twitter:creator" content="@${username}">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${image}">
    <meta name="twitter:url" content="${canonicalUrl}">

    <!-- Article meta -->
    <meta property="article:published_time" content="${post.created_at || new Date().toISOString()}">
    <meta property="article:author" content="${fullName}">

    <link rel="canonical" href="${canonicalUrl}">
</head>
<body>
    <p>Loading PlusOpinion...</p>
</body>
</html>`);
        } else {
            // ===================================================
            // USER PATH: Show a brief loading screen, then redirect
            // to the actual app with the post deep-link.
            // ===================================================
            return res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
    <meta name="description" content="${description}">

    <!-- OG tags still present so link-unfurlers that aren't in crawler list also work -->
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="PlusOpinion">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${image}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${image}">
    <link rel="canonical" href="${canonicalUrl}">
    <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{background:#020205;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:16px}
        .logo{width:72px;height:72px;border-radius:20px;margin-bottom:8px}
        h2{font-size:18px;font-weight:700;letter-spacing:-0.5px}
        p{font-size:13px;color:rgba(255,255,255,0.5)}
        .bar{width:200px;height:3px;background:rgba(255,255,255,0.1);border-radius:2px;overflow:hidden;margin-top:8px}
        .bar-fill{height:100%;background:linear-gradient(90deg,#2f8bff,#6BFFB6);border-radius:2px;animation:load 0.8s ease-out forwards}
        @keyframes load{from{width:0}to{width:100%}}
    </style>
    <script>window.location.replace("${appUrl}");</script>
</head>
<body>
    <img class="logo" src="https://plusopinion.com/icon-192.png" alt="PlusOpinion">
    <h2>Opening Opinion...</h2>
    <p>Redirecting you to PlusOpinion</p>
    <div class="bar"><div class="bar-fill"></div></div>
</body>
</html>`);
        }

    } catch (error) {
        console.error('[post-preview] Error:', error.message);
        return res.redirect('/HOMEPAGE_FINAL.HTML');
    }
}
