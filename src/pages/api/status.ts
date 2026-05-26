import type { APIRoute } from 'astro';

// GET — obtener estatus
export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ status: 'open' }), { status: 200 });
};