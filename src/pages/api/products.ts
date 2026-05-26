import type { APIRoute } from 'astro';
import { getSupabase } from '../lib/supabase';

// GET — obtener productos
export const GET: APIRoute = async () => {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('id');

    if (error) return new Response(JSON.stringify({ error }), { status: 500 });
    return new Response(JSON.stringify(data), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500 });
  }
};

// PATCH — actualizar stock
export const PATCH: APIRoute = async (context) => {
  try {
    const { request, cookies } = context;
    const supabase = getSupabase();

    const session = cookies.get('admin_session');
    if (!session || session.value !== 'authenticated') {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    const body = await request.json();
    const { id, stock } = body;

    if (stock < 0) {
      return new Response(JSON.stringify({ error: 'Stock no puede ser negativo' }), { status: 400 });
    }

    const { data, error } = await (supabase as any)
      .from('productos')
      .update({ stock })
      .eq('id', id)
      .select()
      .single();

    if (error) return new Response(JSON.stringify({ error }), { status: 500 });
    return new Response(JSON.stringify(data), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500 });
  }
};
