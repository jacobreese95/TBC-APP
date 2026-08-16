/**
 * Cloudflare Worker: static assets + YouTube API proxy + Webster 1828 proxy
 * Secret: YOUTUBE_API_KEY (set in Cloudflare dashboard, not in git)
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/youtube/')) {
      return proxyYouTube(url, env);
    }

    if (url.pathname === '/api/webster1828' || url.pathname.startsWith('/api/webster1828/')) {
      return proxyWebster1828(url);
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }
    return new Response('Not found', { status: 404 });
  }
};

async function proxyWebster1828(url) {
  let word = (url.searchParams.get('word') || '').trim();
  if (!word && url.pathname.startsWith('/api/webster1828/')) {
    word = decodeURIComponent(url.pathname.replace(/^\/api\/webster1828\/?/, '') || '');
  }
  word = word.replace(/[^a-zA-Z'\-\s]/g, ' ').trim().split(/\s+/)[0] || '';
  if (!word || word.length > 40) {
    return json({ error: 'Missing or invalid word' }, 400);
  }

  const target =
    'https://webstersdictionary1828.com/Dictionary/' + encodeURIComponent(word);

  try {
    const res = await fetch(target, {
      headers: {
        Accept: 'text/html',
        'User-Agent': 'TBC-Church-App/1.0 (Bible study; +https://tbc-app.jacobreese95.workers.dev)'
      }
    });
    if (!res.ok) {
      return json(
        { word: word, found: false, error: 'Dictionary lookup failed (' + res.status + ')' },
        200
      );
    }
    const html = await res.text();
    const extracted = extractWebsterDefinition(html, word);
    return json(
      {
        word: word,
        found: !!extracted.text,
        title: extracted.title || word,
        text: extracted.text || '',
        source: 'Webster\'s 1828'
      },
      200,
      'public, max-age=86400'
    );
  } catch (err) {
    return json(
      { word: word, found: false, error: err.message || 'Webster proxy failed' },
      502
    );
  }
}

function extractWebsterDefinition(html, word) {
  const headMatch = html.match(/<h3 class="dictionaryhead">([\s\S]*?)<\/h3>/i);
  const title = headMatch
    ? headMatch[1].replace(/<[^>]+>/g, '').trim()
    : word;

  // Primary: block after dictionaryhead inside col-md-6
  let chunk = '';
  const afterHead = html.split(/<h3 class="dictionaryhead">[\s\S]*?<\/h3>\s*<hr\s*\/?>/i)[1];
  if (afterHead) {
    const colEnd = afterHead.search(/<div class="d-md-none"|<div class="col-md-3"|<\/main>/i);
    chunk = colEnd > 0 ? afterHead.slice(0, colEnd) : afterHead.slice(0, 12000);
  }
  if (!chunk) {
    const m = html.match(/<div class="col-md-6">([\s\S]*?)<div class="col-md-3/i);
    if (m) chunk = m[1];
  }

  let text = chunk
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<a[^>]*>/gi, '')
    .replace(/<\/a>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/"/g, '"')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Keep sheet readable
  if (text.length > 2500) {
    text = text.slice(0, 2500).replace(/\s+\S*$/, '') + '…';
  }
  return { title: title, text: text };
}

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

  const resource = url.pathname.replace(/^\/api\/youtube\/?/, '').split('/')[0];
  const allowed = new Set(['search', 'videos', 'channels', 'playlistItems']);
  if (!resource || !allowed.has(resource)) {
    return json({ error: { message: 'Invalid YouTube API path' } }, 400);
  }

  const gUrl = new URL('https://www.googleapis.com/youtube/v3/' + resource);
  url.searchParams.forEach((value, name) => {
    if (name.toLowerCase() === 'key') return;
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

function json(obj, status, cache) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': cache || 'no-store',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
