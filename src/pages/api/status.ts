import type { APIRoute } from 'astro';
import { getSupabase } from '../lib/supabase';

// GET — obtener estatus
export const GET: APIRoute = async () => {
  try {
    const supabase = getSupabase();

    const { data, error } = await (supabase as any)
      .from('setting')
      .select('value')
      .eq('key', 'barber_status')
      .single();

    if (error) return new Response(JSON.stringify({ status: 'open' }), { status: 200 });
    return new Response(JSON.stringify({ status: data.value }), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ status: 'open' }), { status: 200 });
  }
};

export const PATCH: APIRoute = async (context) => {
  try {
    const { request, cookies } = context;
    const supabase = getSupabase();

    const session = cookies.get('admin_session');
    console.log('Session en status PATCH:', session?.value);

    if (!session || session.value !== 'authenticated') {
      console.log('No autorizado en status PATCH');
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    const { status } = await request.json();
    console.log('Actualizando estatus a:', status);

    const { error } = await (supabase as any)
      .from('setting')
      .update({ value: status })
      .eq('key', 'barber_status');

    console.log('Error de Supabase:', error);

    if (error) return new Response(JSON.stringify({ error }), { status: 500 });
    return new Response(JSON.stringify({ ok: true, status }), { status: 200 });

  } catch (error) {
    console.error('Error en status PATCH:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500 });
  }
};