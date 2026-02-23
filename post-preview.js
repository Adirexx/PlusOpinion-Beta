/**
 * API Route: /post/:id
 * 
 * This server-side function generates dynamic Open Graph (OG) tags
 * for social media previews (WhatsApp, X, Facebook, etc.)
 * and then redirects the real user to the main feed with the post ID.
 */

export default async function handler(req, res) {
    // Extract id from query (Vercel automatically handles this for rewrites)
    const { id } = req.query;

    if (!id) {
        console.log('No ID provided, redirecting to feed');
        return res.redirect('/feed');
    }

    try {
        const SUPABASE_URL = "https://ogqyemyrxogpnwitumsr.supabase.co";
        const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ncXllbXlyeG9ncG53aXR1bXNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NTA4MDAsImV4cCI6MjA4NTAyNjgwMH0.cyWTrBkbKdrgrm31k5EgefdTBOsEeBaHjsD4NgGVjCM";

        // Fetch post data using REST API to avoid dependency issues in basic environments
        // We include profiles to get username and avatar
        const apiUrl = `${SUPABASE_URL}/rest/v1/posts?id=eq.${id}&select=*,profiles:user_id(username,full_name,avatar_url,rqs_score)`;

        const response = await fetch(apiUrl, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error(`Supabase error: ${response.statusText}`);
        }

        const posts = await response.json();
        const post = posts[0];

        // If post not found, redirect to feed
        if (!post) {
            console.log(`Post ${id} not found`);
            return res.redirect('/feed');
        }

        // Prepare metadata
        const username = post.profiles?.username || 'user';
        const fullName = post.profiles?.full_name || 'PlusOpinion User';
        const postText = post.text_content || '';
        const rqs = post.profiles?.rqs_score || 0;

        // Clean text for meta tags (remove newlines, quotes)
        const cleanDescription = (postText.replace(/[\r\n]+/g, ' ').replace(/"/g, '&quot;').substring(0, 180) + '...').trim();
        const title = `${fullName} (@${username}) | RQS ${rqs}`;
        const image = post.media_url || post.profiles?.avatar_url || 'https://plusopinion.com/icon-512.png';
        const url = `https://plusopinion.com/post/${id}`;

        // Return HTML with OG tags and auto-redirect
        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    
    <!-- Secondary meta tags -->
    <meta name="description" content="${cleanDescription}">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="${url}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${cleanDescription}">
    <meta property="og:image" content="${image}">
    <meta property="og:site_name" content="PlusOpinion">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${url}">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${cleanDescription}">
    <meta name="twitter:image" content="${image}">
    <meta name="twitter:creator" content="@${username}">

    <!-- Logic: Canonical URL points to the intended clean path -->
    <link rel="canonical" href="${url}">

    <!-- 
      Redirect to the main feed with the post ID.
      The frontend (HOMEPAGE_FINAL.HTML) will read the 'post' param 
      and show the specific post content to the user.
    -->
    <meta http-equiv="refresh" content="0;url=/HOMEPAGE_FINAL.HTML?post=${id}">
    <script>
        window.location.replace("/HOMEPAGE_FINAL.HTML?post=${id}");
    </script>
</head>
<body style="background: #020205; color: white; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
    <div style="text-align: center;">
        <img src="/icon-192.png" width="80" height="80" style="margin-bottom: 20px; border-radius: 20px;">
        <h2>Opening Opinion...</h2>
        <p style="color: rgba(255,255,255,0.6)">Redirecting you to PlusOpinion</p>
    </div>
</body>
</html>`);

    } catch (error) {
        console.error('Preview system error:', error);
        // Fallback to feed if everything fails
        return res.redirect('/feed');
    }
}
