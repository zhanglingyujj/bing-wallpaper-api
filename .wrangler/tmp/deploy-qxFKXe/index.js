var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.js
var index_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS",
      "Access-Control-Max-Age": "86400"
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    try {
      if (path === "/" || path === "/latest") {
        const data = await getBingDaily(env);
        return Response.redirect("https://www.bing.com" + data.url, 302);
      } else if (path === "/api/today") {
        const data = await getBingDaily(env);
        return new Response(JSON.stringify(data), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      } else if (path === "/random") {
        const image = await env.DB.prepare("SELECT url FROM wallpapers ORDER BY RANDOM() LIMIT 1").first();
        if (image) {
          return Response.redirect("https://www.bing.com" + image.url, 302);
        } else {
          return Response.redirect("https://www.bing.com", 302);
        }
      } else if (path === "/api/random") {
        const image = await env.DB.prepare("SELECT * FROM wallpapers ORDER BY RANDOM() LIMIT 1").first();
        if (image) {
          try {
            image.details = JSON.parse(image.json);
          } catch (e) {
          }
          return new Response(JSON.stringify(image), {
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        return new Response(JSON.stringify({ error: "Database empty" }), { status: 404, headers: corsHeaders });
      } else if (path === "/api/archive" || path === "/list") {
        const page = parseInt(url.searchParams.get("page")) || 1;
        const limit = parseInt(url.searchParams.get("limit")) || 10;
        const offset = (page - 1) * limit;
        const { results } = await env.DB.prepare("SELECT * FROM wallpapers ORDER BY date DESC LIMIT ? OFFSET ?").bind(limit, offset).all();
        return new Response(JSON.stringify(results), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      return new Response("Not Found", { status: 404 });
    } catch (e) {
      return new Response("Error: " + e.message, { status: 500 });
    }
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(updateDailyWallpaper(env));
  }
};
async function getBingDaily(env) {
  return await updateDailyWallpaper(env);
}
__name(getBingDaily, "getBingDaily");
async function updateDailyWallpaper(env) {
  const bingUrl = "https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=en-US";
  const response = await fetch(bingUrl);
  const data = await response.json();
  if (data.images && data.images.length > 0) {
    const image = data.images[0];
    const date = image.startdate;
    const title = image.title;
    const copyright = image.copyright;
    const url = image.url;
    const jsonStr = JSON.stringify(image);
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
  throw new Error("Failed to fetch from Bing");
}
__name(updateDailyWallpaper, "updateDailyWallpaper");
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
