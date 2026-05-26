import type { APIRoute } from 'astro';
import { getSupabase } from '../lib/supabase';
import { getEmitter, EVENTS } from '../lib/events/AppointmentEvents';
import { initObservers } from '../lib/observers/index';

// Inicializar observers
initObservers();

// Helper para descontar stock
async function discountStock(supabase: any, products: string) {
  const productNames = products
    .split(',')
    .map((p: string) => p.replace(/\s*\(\$\d+\)/, '').trim());

  for (const productName of productNames) {
    const { data: product } = await supabase
      .from('productos')
      .select('id, stock')
      .eq('name', productName)
      .single();

    if (product && product.stock > 0) {
      await supabase
        .from('productos')
        .update({ stock: product.stock - 1 })
        .eq('id', product.id);
    }
  }
}

// Helper para devolver stock
async function restoreStock(supabase: any, products: string) {
  const productNames = products
    .split(',')
    .map((p: string) => p.replace(/\s*\(\$\d+\)/, '').trim());

  for (const productName of productNames) {
    const { data: product } = await supabase
      .from('productos')
      .select('id, stock')
      .eq('name', productName)
      .single();

    if (product) {
      await supabase
        .from('productos')
        .update({ stock: product.stock + 1 })
        .eq('id', product.id);
    }
  }
}

// GET — obtener citas
export const GET: APIRoute = async ({ url }) => {
  try {
    const supabase = getSupabase();
    const date = url.searchParams.get('date');
    const id = url.searchParams.get('id');

    // Si viene un ID buscar cita específica
    if (id) {
      const { data, error } = await (supabase as any)
        .from('appointments')
        .select('*')
        .eq('id', id)
        .single();

      if (error) return new Response(JSON.stringify({ error }), { status: 500 });
      return new Response(JSON.stringify(data), { status: 200 });
    }

    let query = supabase
      .from('appointments')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (date) query = query.gte('date', date);

    const { data, error } = await query;

    if (error) return new Response(JSON.stringify({ error }), { status: 500 });
    return new Response(JSON.stringify(data), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500 });
  }
};

// POST — crear cita
export const POST: APIRoute = async ({ request }) => {
  try {
    const supabase = getSupabase();
    const emitter = getEmitter();

    const body = await request.json();
    const { name, phone, email, service, date, time, notes, products, persons } = body;

    if (!name || !phone || !email || !service || !date || !time) {
      return new Response(JSON.stringify({ error: 'Faltan campos requeridos' }), { status: 400 });
    }

    // Verificar hora ocupada
    const { data: existing } = await supabase
      .from('appointments')
      .select('id')
      .eq('date', date)
      .eq('time', time)
      .neq('status', 'rejected');

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ error: 'Horario ocupado' }), { status: 409 });
    }

    // Guardar cita
    const { data, error } = await supabase.from('appointments').insert({
      name, phone, email, service, date, time,
      notes: notes || null,
      products: products || 'Ninguno',
      persons: persons || 1,
      status: 'pending',
    } as any).select().single();

    if (error) return new Response(JSON.stringify({ error }), { status: 500 });

    // Descontar stock si pidió productos
    if (products && products !== 'Ninguno') {
      await discountStock(supabase, products);
    }

    // Notificar observers
    try {
      await emitter.emit(EVENTS.APPOINTMENT_CREATED, data);
    } catch (observerError) {
      console.error('Error en observer:', observerError);
    }

    return new Response(JSON.stringify(data), { status: 201 });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500 });
  }
};

// PATCH — actualizar estatus
export const PATCH: APIRoute = async (context) => {
  try {
    const { request, cookies } = context;
    const supabase = getSupabase();
    const emitter = getEmitter();

    const session = cookies.get('admin_session');
    if (!session || session.value !== 'authenticated') {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    const body = await request.json();
    const { id, status } = body;

    const { data, error } = await (supabase as any)
      .from('appointments')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) return new Response(JSON.stringify({ error }), { status: 500 });

    // Si se rechaza o cancela, devolver stock
    if ((status === 'rejected' || status === 'cancelled') &&
        data.products && data.products !== 'Ninguno') {
      await restoreStock(supabase, data.products);
    }

    // Emitir evento
    try {
      if (status === 'accepted') {
        await emitter.emit(EVENTS.APPOINTMENT_ACCEPTED, data);
      } else if (status === 'rejected') {
        await emitter.emit(EVENTS.APPOINTMENT_REJECTED, data);
      } else if (status === 'cancelled') {
        await emitter.emit(EVENTS.APPOINTMENT_CANCELLED, data);
      }
    } catch (observerError) {
      console.error('Error en Observer:', observerError);
    }

    return new Response(JSON.stringify(data), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500 });
  }
};