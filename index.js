export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS',
      'Access-Control-Max-Age': '86400',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (path === '/' || path === '/latest') {
        // Redirect to today's image URL
        const data = await getBingDaily(env);
        return Response.redirect('https://www.bing.com' + data.url, 302);
      } 
      
      else if (path === '/api/today') {
        // Return today's metadata
        const data = await getBingDaily(env);
        return new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      
      else if (path === '/random') {
        // Redirect to a random image URL
        const image = await env.DB.prepare('SELECT url FROM wallpapers ORDER BY RANDOM() LIMIT 1').first();
        if (image) {
          return Response.redirect('https://www.bing.com' + image.url, 302);
        } else {
            // Fallback if DB is empty
            return Response.redirect('https://www.bing.com', 302); 
        }
      }

      else if (path === '/api/random') {
        // Return random image metadata
        const image = await env.DB.prepare('SELECT * FROM wallpapers ORDER BY RANDOM() LIMIT 1').first();
        if (image) {
             // Parse the stored JSON string back to object if needed, or just return the row
             // The row has 'json' column which is the raw bing response
             try {
                image.details = JSON.parse(image.json);
             } catch(e) {}
             return new Response(JSON.stringify(image), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders },
             });
        }
        return new Response(JSON.stringify({ error: 'Database empty' }), { status: 404, headers: corsHeaders });
      }

      else if (path === '/api/archive' || path === '/list') {
        // List archived images
        // Optional pagination: ?page=1&limit=10
        const page = parseInt(url.searchParams.get('page')) || 1;
        const limit = parseInt(url.searchParams.get('limit')) || 10;
        const offset = (page - 1) * limit;

        const { results } = await env.DB.prepare('SELECT * FROM wallpapers ORDER BY date DESC LIMIT ? OFFSET ?')
          .bind(limit, offset)
          .all();
        
        return new Response(JSON.stringify(results), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      return new Response('Not Found', { status: 404 });

    } catch (e) {
      return new Response('Error: ' + e.message, { status: 500 });
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(updateDailyWallpaper(env));
  }
};

async function getBingDaily(env) {
    // Helper to get today's data. 
    // Logic: Try to fetch from DB first (if we ran the scheduled task), otherwise fetch from Bing API.
    // However, since scheduled task runs periodically, for real-time /today request, 
    // we might want to fetch live from Bing to ensure it's fresh, then save to DB.
    
    // Strategy: Fetch live from Bing, save/update DB, return data.
    return await updateDailyWallpaper(env);
}

async function updateDailyWallpaper(env) {
    const bingUrl = 'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=en-US';
    const response = await fetch(bingUrl);
    const data = await response.json();
    
    if (data.images && data.images.length > 0) {
        const image = data.images[0];
        const date = image.startdate;
        const title = image.title; // Note: 'title' field availability depends on mkt and response format, sometimes it's copyright
        const copyright = image.copyright;
        const url = image.url;
        const jsonStr = JSON.stringify(image);

        // Insert or Ignore into D1
        // We use INSERT OR REPLACE or INSERT OR IGNORE. REPLACE updates if exists.
        await env.DB.prepare(
            `INSERT OR REPLACE INTO wallpapers (date, title, copyright, url, json) VALUES (?, ?, ?, ?, ?)`
        ).bind(date, title, copyright, url, jsonStr).run();

        return {
            date,
            title,
            copyright,
            url,
            raw: image
        };
    }
    throw new Error('Failed to fetch from Bing');
}
