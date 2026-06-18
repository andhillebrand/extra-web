import { getStore } from "@netlify/blobs";

const KEY = "top";

function clean(body) {
  let n = String(body && body.n || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3) || "AH";
  let s = parseInt(body && body.s, 10);
  if (!Number.isFinite(s)) s = 0;
  s = Math.max(0, Math.min(99999, s));
  return { n, s, t: Date.now() };
}

export default async (req) => {
  const store = getStore({ name: "leaderboard", consistency: "strong" });

  if (req.method === "GET") {
    const data = await store.get(KEY, { type: "json" });
    return Response.json(Array.isArray(data) ? data : []);
  }

  if (req.method === "POST") {
    let body;
    try { body = await req.json(); } catch (e) { return new Response("bad json", { status: 400 }); }
    const entry = clean(body);
    const cur = (await store.get(KEY, { type: "json" })) || [];
    cur.push(entry);
    cur.sort((a, b) => b.s - a.s);
    const top = cur.slice(0, 20);
    await store.setJSON(KEY, top);
    return Response.json(top);
  }

  return new Response("method not allowed", { status: 405 });
};
