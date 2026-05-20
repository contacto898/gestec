import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Obtener todos los emails pendientes de promoción
    const pendingInvites = await base44.asServiceRole.entities.PendingAdminInvite.list();
    if (pendingInvites.length === 0) {
      return Response.json({ promoted: 0 });
    }

    // Obtener todos los usuarios registrados
    const users = await base44.asServiceRole.entities.User.list();

    let promoted = 0;
    for (const invite of pendingInvites) {
      const user = users.find(u => u.email?.toLowerCase() === invite.email?.toLowerCase());
      if (user && user.role !== "admin") {
        await base44.asServiceRole.entities.User.update(user.id, { role: "admin" });
        await base44.asServiceRole.entities.PendingAdminInvite.delete(invite.id);
        promoted++;
      }
    }

    return Response.json({ promoted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});