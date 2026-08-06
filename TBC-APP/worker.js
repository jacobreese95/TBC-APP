/**
 * Cloudflare Worker: static assets + YouTube API proxy
 * Secret: YOUTUBE_API_KEY (set in Cloudflare dashboard, not in git)
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/youtube/')) {
      return proxyYouTube(url, env);
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }
    return new Response('Not found', { status: 404 });
  }
};

async function proxyYouTube(url, env) {
  const key = env.YOUTUBE_API_KEY;
  if (!key) {
    return json(
      {
        error: {
          message:
            'YouTube API key is not configured on the server. Add YOUTUBE_API_KEY in Cloudflare Worker secrets.'
        }
      },
      500
    );
  }

  // Only allow known YouTube Data API v3 resource names
  const resource = url.pathname.replace(/^\/api\/youtube\/?/, '').split('/')[0];
  const allowed = new Set(['search', 'videos', 'channels', 'playlistItems']);
  if (!resource || !allowed.has(resource)) {
    return json({ error: { message: 'Invalid YouTube API path' } }, 400);
  }

  const gUrl = new URL('https://www.googleapis.com/youtube/v3/' + resource);
  url.searchParams.forEach((value, name) => {
    if (name.toLowerCase() === 'key') return; // never accept client-supplied keys
    gUrl.searchParams.set(name, value);
  });
  gUrl.searchParams.set('key', key);

  try {
    const res = await fetch(gUrl.toString(), {
      headers: { Accept: 'application/json' }
    });
    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': res.ok ? 'public, max-age=120' : 'no-store'
      }
    });
  } catch (err) {
    return json(
      { error: { message: err.message || 'YouTube proxy failed' } },
      502
    );
  }
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}
