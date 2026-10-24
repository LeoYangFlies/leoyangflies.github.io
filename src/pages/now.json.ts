import type { APIRoute } from 'astro';
import { getNow } from '../lib/now';

// What the home page banner is showing, so the scheduled job can tell whether the site
// needs rebuilding. Contains only the current leg's airports while in the air.
export const GET: APIRoute = () =>
  new Response(JSON.stringify(getNow()), { headers: { 'Content-Type': 'application/json' } });
