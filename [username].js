/**
 * Cloudflare Pages Function: /profile/:username
 */

const SOCIAL_CRAWLERS = [
    'whatsapp', 'telegram', 'twitterbot', 'facebookexternalhit', 'facebot',
    'linkedinbot', 'slackbot', 'discordbot', 'skype', 'googlebot', 'bingbot',
    'iframely', 'embedly', 'outbrain', 'vkshare', 'w3c_validator', 'curl',
    'wget', 'python-requests', 'axios', 'preview'
];

function isCrawler(userAgent = '') {
    const ua = userAgent.toLowerCase();
    return SOCIAL_CRAWLERS.some(bot => ua.includes(bot));
}

export async function onRequest(context) {
    const { request, params, env } = context;
    const username = params.username;
    const userAgent = request.headers.get('user-agent') || '';

    if (!username) {
        return Response.redirect(new URL('/HOMEPAGE_FINAL.HTML', request.url), 302);
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

        if (!response.ok) throw new Error(`Supabase error`);

        const profiles = await response.json();
        const profile = profiles[0];

        if (!profile) {
            return Response.redirect(new URL('/HOMEPAGE_FINAL.HTML', request.url), 302);
        }

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
        const appUrl = `/profile?username=${encodeURIComponent(username)}`;

        const isBot = isCrawler(userAgent);
        let html = '';

        if (isBot) {
            html = `<!DOCTYPE html>
<html prefix="og: https://ogp.me/ns#" lang="en">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <meta name="description" content="${description}">
    <meta property="og:type" content="profile">
    <meta property="og:site_name" content="PlusOpinion">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${image}">
    <meta property="og:image:width" content="400">
    <meta property="og:image:height" content="400">
    <meta property="profile:username" content="${username}">
    <meta property="profile:first_name" content="${fullName.split(' ')[0]}">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${image}">
</head>
<body><p>Loading PlusOpinion profile...</p></body>
</html>`;
        } else {
            html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${image}">
    <style>body{background:#020205;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;} .avatar{width:72px;height:72px;border-radius:50%;object-fit:cover;margin-bottom:8px} .bar{width:200px;height:3px;background:rgba(255,255,255,0.1);margin-top:8px;} .bar-fill{height:100%;background:linear-gradient(90deg,#2f8bff,#6BFFB6);animation:load 0.8s ease-out forwards;} @keyframes load{from{width:0}to{width:100%}}</style>
    <script>window.location.replace("${appUrl}");</script>
</head>
<body><div style="text-align:center"><img class="avatar" src="${image}" onerror="this.src='https://plusopinion.com/icon-192.png'"><h3>${fullName}</h3><div class="bar"><div class="bar-fill"></div></div></div></body>
</html>`;
        }

        return new Response(html, {
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'public, max-age=60, s-maxage=60'
            }
        });

    } catch (error) {
        return Response.redirect(new URL('/HOMEPAGE_FINAL.HTML', request.url), 302);
    }
}
