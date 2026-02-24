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

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const userAgent = request.headers.get('user-agent') || '';

        // 0. Supabase ISP Bypass Proxy
        // Intercept all requests to /supabase-api/* and forward them to Supabase backend securely
        // This bypasses Indian ISPs (like Jio) blocking .supabase.co domains via DNS poisoning
        if (url.pathname.startsWith('/supabase-api/')) {
            const targetUrl = new URL(request.url);
            targetUrl.hostname = 'ogqyemyrxogpnwitumsr.supabase.co';
            targetUrl.pathname = targetUrl.pathname.replace('/supabase-api', '');

            // Cloudflare Worker correctly forwards methods, bodies, and CORS headers
            const proxyRequest = new Request(targetUrl.toString(), request);
            return fetch(proxyRequest);
        }

        // 1. Check if this is a POST sharing link: /post/:id
        if (url.pathname.startsWith('/post/')) {
            const parts = url.pathname.split('/');
            const id = parts[2] ? parts[2].split('?')[0] : null;

            if (id) {
                return await handlePostPreview(id, url, userAgent);
            }
        }

        // 2. Check if this is a PROFILE sharing link: /profile/:username
        if (url.pathname.startsWith('/profile/')) {
            const parts = url.pathname.split('/');
            const username = parts[2] ? parts[2].split('?')[0] : null;

            if (username && username !== '') {
                return await handleProfilePreview(username, url, userAgent);
            }
        }

        // 3. Otherwise, pass the request through to the standard Cloudflare Pages static assets
        return env.ASSETS.fetch(request);
    }
};

async function handlePostPreview(id, url, userAgent) {
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

        if (!response.ok) throw new Error('Supabase Error');
        const posts = await response.json();
        const post = posts[0];

        if (!post) {
            return Response.redirect(new URL('/HOMEPAGE_FINAL.HTML', url), 302);
        }

        const username = post.profiles?.username || 'user';
        const fullName = post.profiles?.full_name || 'PlusOpinion User';
        const safeText = (post.text_content || '')
            .replace(/[\r\n]+/g, ' ')
            .replace(/[<>"&]/g, c => ({ '<': '&lt;', '>': '&gt;', '"': '&quot;', '&': '&amp;' }[c]))
            .substring(0, 200);

        const rqs = post.profiles?.rqs_score || 0;
        const isVerified = post.is_verified_purchase === true;

        const description = safeText ? `"${safeText}..." · ${isVerified ? '✅ Verified Purchase · ' : ''}Read full opinion on PlusOpinion` : `See what ${fullName} thinks on PlusOpinion`;
        const title = `${fullName} (@${username}) · RQS ${rqs} on PlusOpinion`;

        let image = 'https://plusopinion.com/icon-512.png';
        if (post.media_url && !post.media_url.match(/\.(mp4|mov|webm)$/i)) {
            image = post.media_url;
        } else if (post.profiles?.avatar_url) {
            image = post.profiles.avatar_url;
        }

        const canonicalUrl = `https://plusopinion.com/post/${id}`;
        const appUrl = `/HOMEPAGE_FINAL.HTML?post=${id}`;

        return generateHtmlResponse(title, description, image, canonicalUrl, appUrl, isCrawler(userAgent), 'article');
    } catch (e) {
        return Response.redirect(new URL('/HOMEPAGE_FINAL.HTML', url), 302);
    }
}

async function handleProfilePreview(username, url, userAgent) {
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

        if (!response.ok) throw new Error('Supabase error');
        const profiles = await response.json();
        const profile = profiles[0];

        if (!profile) {
            return Response.redirect(new URL('/HOMEPAGE_FINAL.HTML', url), 302);
        }

        const fullName = profile.full_name || 'PlusOpinion User';
        const rqs = profile.rqs_score || 0;
        const safeBio = (profile.bio || '')
            .replace(/[\r\n]+/g, ' ')
            .replace(/[<>"&]/g, c => ({ '<': '&lt;', '>': '&gt;', '"': '&quot;', '&': '&amp;' }[c]))
            .substring(0, 200);

        const title = `${fullName} (@${username}) · RQS ${rqs} on PlusOpinion`;
        const description = safeBio ? `${safeBio} · Follow @${username} on PlusOpinion` : `See @${username}'s opinions, reviews and RQS score on PlusOpinion`;
        const image = profile.avatar_url || 'https://plusopinion.com/icon-512.png';
        const canonicalUrl = `https://plusopinion.com/profile/${username}`;
        const appUrl = `/profile?username=${encodeURIComponent(username)}`;

        return generateHtmlResponse(title, description, image, canonicalUrl, appUrl, isCrawler(userAgent), 'profile');
    } catch (e) {
        return Response.redirect(new URL('/HOMEPAGE_FINAL.HTML', url), 302);
    }
}

function generateHtmlResponse(title, description, image, canonicalUrl, appUrl, isBot, type) {
    // WhatsApp drops images larger than ~300KB.
    if (!image || image.includes('icon-512.png')) {
        image = 'https://plusopinion.com/seo-preview.jpg';
    } else if (image.includes('supabase.co')) {
        // Supabase Image Transformations require a paid Pro tier.
        // Instead, we route the image through a highly reliable, free image resizing CDN (wsrv.nl)
        // to guarantee it is compressed below 300KB and formatted as a strict JPEG for WhatsApp.
        image = `https://wsrv.nl/?url=${encodeURIComponent(image)}&w=600&h=600&fit=cover&output=jpg&q=70`;
    }

    let html = '';
    if (isBot) {
        html = `<!DOCTYPE html>
<html prefix="og: https://ogp.me/ns#" lang="en">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <meta name="description" content="${description}">
    
    <!-- OpenGraph Required -->
    <meta property="og:type" content="${type}">
    <meta property="og:site_name" content="PlusOpinion">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" itemprop="image" content="${image}">
    
    <!-- Removed strict og:image:width/height as WhatsApp rejects mismatched dimensions -->
    <meta property="og:image:alt" content="PlusOpinion Preview">
    
    <!-- Twitter/X -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${image}">
</head>
<body><p>Loading PlusOpinion...</p></body>
</html>`;
    } else {
        html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <!-- Fallback OG tags just in case -->
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${image}">
    <meta name="twitter:card" content="summary_large_image">
    <style>body{background:#020205;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;} .avatar{width:72px;border-radius:20px;margin-bottom:8px;} .bar{width:200px;height:3px;background:rgba(255,255,255,0.1);margin-top:8px;} .bar-fill{height:100%;background:linear-gradient(90deg,#2f8bff,#6BFFB6);animation:load 0.8s ease-out forwards;} @keyframes load{from{width:0}to{width:100%}}</style>
    <script>window.location.replace("${appUrl}");</script>
</head>
<body><div style="text-align:center"><img class="avatar" src="${image}" onerror="this.src='https://plusopinion.com/icon-192.png'"><h3>Redirecting...</h3><div class="bar"><div class="bar-fill"></div></div></div></body>
</html>`;
    }

    return new Response(html, {
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=60, s-maxage=60'
        }
    });
}
