import type { APIRoute } from 'astro';

console.log('ENV cargado:', import.meta.env.ADMIN_PASSWORD);

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { password } = await request.json();
    console.log('Password recibida:', password);
    console.log('Password esperada:', import.meta.env.ADMIN_PASSWORD);

    if (password !== import.meta.env.ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    // Crear cookie de sesión
    cookies.set('admin_session', 'authenticated', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 horas
      path: '/',
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ cookies }) => {
  cookies.delete('admin_session', { path: '/' });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};

