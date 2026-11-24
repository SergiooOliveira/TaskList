import { normalizeUrl } from '../_shared/url.ts';
import { parseProduct } from './parse.ts';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let url: string | null = null;
  try {
    const body = await req.json();
    url = typeof body?.url === 'string' ? normalizeUrl(body.url) : null;
  } catch { /* falls through to 400 */ }
  if (!url) return json({ error: 'Invalid URL' }, 400);

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      redirect: 'follow',
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return json({});
    return json(parseProduct(await res.text()));
  } catch {
    return json({});
  }
});
