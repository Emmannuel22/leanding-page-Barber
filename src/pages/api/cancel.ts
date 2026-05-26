import type { APIRoute } from 'astro';
import { getSupabase } from '../lib/supabase';
import { getEmitter, EVENTS } from '../lib/events/AppointmentEvents';

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

export const POST: APIRoute = async ({ request }) => {
  try {
    const supabase = getSupabase();
    const emitter = getEmitter();

    const { id } = await request.json();

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID requerido' }), { status: 400 });
    }

    // Obtener la cita
    const { data: apt, error: fetchError } = await (supabase as any)
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !apt) {
      return new Response(JSON.stringify({ error: 'Cita no encontrada' }), { status: 404 });
    }

    if (apt.status === 'cancelled') {
      return new Response(JSON.stringify({ error: 'La cita ya fue cancelada' }), { status: 400 });
    }

    if (apt.status === 'rejected') {
      return new Response(JSON.stringify({ error: 'La cita ya fue rechazada' }), { status: 400 });
    }

    // Cancelar cita
    const { data, error } = await (supabase as any)
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();

    if (error) return new Response(JSON.stringify({ error }), { status: 500 });

    // Devolver stock si tenía productos
    if (apt.products && apt.products !== 'Ninguno') {
      await restoreStock(supabase, apt.products);
    }

    // Notificar al dueño
    try {
      await emitter.emit(EVENTS.APPOINTMENT_CANCELLED, data);
    } catch (observerError) {
      console.error('Error en observer:', observerError);
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500 });
  }
};