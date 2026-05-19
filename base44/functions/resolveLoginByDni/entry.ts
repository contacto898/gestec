import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { dni } = await req.json();

    if (!dni || !/^\d{8}$/.test(dni)) {
      return Response.json({ error: 'DNI inválido' }, { status: 400 });
    }

    // Buscar el usuario con ese DNI
    const users = await base44.asServiceRole.entities.User.filter({ dni });

    if (!users || users.length === 0) {
      return Response.json({ email: null });
    }

    return Response.json({ email: users[0].email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});