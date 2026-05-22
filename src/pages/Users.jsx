import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Shield, UserPlus, Users, Eye, EyeOff, KeyRound, UserX } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const ALL_PERMISSIONS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "planilla", label: "Planilla" },
  { id: "finanzas", label: "Ingresos y Gastos" },
  { id: "categorias", label: "Categorías" },
  { id: "descuentos", label: "Descuentos y Adelantos" },
  { id: "gastos_fijos", label: "Gastos Fijos" },
  { id: "usuarios", label: "Gestión de Usuarios" },
];

const ROLE_COLORS = ["#4F63D2", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

// ── Role Form ──────────────────────────────────────────────────────────────────
function RoleForm({ open, onClose, onSubmit, editing }) {
  const init = editing || { name: "", description: "", permissions: ["dashboard"], color: ROLE_COLORS[0] };
  const [form, setForm] = useState(init);

  useEffect(() => { if (open) setForm(editing || init); }, [open, editing]);

  const togglePermission = (id) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(id)
        ? f.permissions.filter((p) => p !== id)
        : [...f.permissions, id],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar Rol" : "Nuevo Rol"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Nombre del rol</Label>
            <Input placeholder="Ej: Contador, Supervisor..." value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Input placeholder="¿Qué puede hacer este rol?" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {ROLE_COLORS.map((c) => (
                <button key={c} onClick={() => setForm({ ...form, color: c })}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${form.color === c ? "border-foreground scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Permisos de acceso</Label>
            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl border bg-muted/20">
              {ALL_PERMISSIONS.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={form.permissions.includes(p.id)}
                    onCheckedChange={() => togglePermission(p.id)} />
                  {p.label}
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => { onSubmit(form); onClose(); }} disabled={!form.name.trim()}>
              {editing ? "Actualizar" : "Crear Rol"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Create User Dialog ────────────────────────────────────────────────────────
function CreateUserDialog({ open, onClose }) {
  const [form, setForm] = useState({ email: "", appRole: "user" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState(null);
  const registerUrl = `${window.location.origin}/register`;

  useEffect(() => {
    if (open) { setForm({ email: "", appRole: "user" }); setMsg(null); setDone(false); }
  }, [open]);

  const handleCreate = async () => {
    if (!form.email.trim()) return;
    setLoading(true);
    setMsg(null);
    try {
      await base44.users.inviteUser(form.email.trim(), form.appRole);
      if (form.appRole === "admin") {
        await base44.entities.PendingAdminInvite.create({ email: form.email.trim() });
      }
      setDone(true);
    } catch (e) {
      setMsg({ type: "error", text: e.message || "Error al crear usuario" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" /> Crear Nuevo Usuario
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {!done ? (
            <>
              <p className="text-sm text-muted-foreground">
                Ingresa el correo del nuevo usuario. Luego compártele el enlace de registro para que cree su propia contraseña.
              </p>
              <div className="space-y-2">
                <Label>Correo electrónico</Label>
                <Input type="email" placeholder="correo@ejemplo.com" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Nivel de acceso</Label>
                <Select value={form.appRole} onValueChange={(v) => setForm({ ...form, appRole: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="user">Usuario</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {msg && (
                <p className="text-sm px-3 py-2 rounded-lg bg-red-50 text-red-600">{msg.text}</p>
              )}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleCreate} disabled={loading || !form.email.trim()} className="gap-2">
                  <UserPlus className="w-4 h-4" /> {loading ? "Procesando..." : "Agregar Usuario"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3">
                <p className="text-sm font-semibold text-emerald-800">✓ Usuario registrado en el sistema</p>
                <p className="text-sm text-emerald-700">
                  Comparte este enlace con <strong>{form.email}</strong> para que cree su contraseña:
                </p>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-white border rounded px-2 py-1 flex-1 truncate text-emerald-900">{registerUrl}</code>
                  <Button size="sm" variant="outline" className="shrink-0"
                    onClick={() => { navigator.clipboard.writeText(registerUrl); }}>
                    Copiar
                  </Button>
                </div>
                <p className="text-xs text-emerald-600">
                  El usuario ingresa a ese enlace, escribe su correo y contraseña, verifica el código que le llega al correo, y listo.
                </p>
              </div>
              <div className="flex justify-end">
                <Button onClick={onClose}>Cerrar</Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Change Password Dialog ────────────────────────────────────────────────────
function ChangePasswordDialog({ open, onClose }) {
  const [form, setForm] = useState({ current: "", newPass: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (open) { setForm({ current: "", newPass: "", confirm: "" }); setMsg(null); }
  }, [open]);

  const handleChange = async () => {
    if (!form.newPass || !form.confirm) return;
    if (form.newPass !== form.confirm) {
      setMsg({ type: "error", text: "Las contraseñas nuevas no coinciden" });
      return;
    }
    if (form.newPass.length < 6) {
      setMsg({ type: "error", text: "La nueva contraseña debe tener al menos 6 caracteres" });
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      // Use base44 auth to update password
      await base44.auth.updateMe({ password: form.newPass });
      setMsg({ type: "success", text: "Contraseña actualizada correctamente" });
      setTimeout(() => onClose(), 1500);
    } catch (e) {
      setMsg({ type: "error", text: e.message || "Error al cambiar contraseña" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5" /> Cambiar mi Contraseña
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Nueva contraseña</Label>
            <div className="relative">
              <Input type={showPass ? "text" : "password"} placeholder="Mínimo 6 caracteres"
                value={form.newPass} onChange={(e) => setForm({ ...form, newPass: e.target.value })} />
              <button onClick={() => setShowPass(!showPass)} type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Confirmar nueva contraseña</Label>
            <Input type={showPass ? "text" : "password"} placeholder="Repite la contraseña"
              value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
          </div>
          {msg && (
            <p className={`text-sm px-3 py-2 rounded-lg ${msg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
              {msg.text}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleChange} disabled={loading || !form.newPass.trim() || !form.confirm.trim()} className="gap-2">
              <KeyRound className="w-4 h-4" /> {loading ? "Actualizando..." : "Cambiar Contraseña"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete Account Dialog ─────────────────────────────────────────────────────
function DeleteAccountDialog({ open, onClose, currentUser }) {
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (open) setConfirm(""); }, [open]);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await base44.entities.User.delete(currentUser.id);
      base44.auth.logout();
    } catch (e) {
      alert(e.message || "Error al eliminar la cuenta");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <UserX className="w-5 h-5" /> Eliminar mi Cuenta
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive font-medium">⚠️ Esta acción es irreversible.</p>
            <p className="text-xs text-muted-foreground mt-1">Tu cuenta será eliminada permanentemente. Todos tus datos de sesión se borrarán.</p>
          </div>
          <div className="space-y-2">
            <Label>Escribe <strong>ELIMINAR</strong> para confirmar</Label>
            <Input placeholder="ELIMINAR" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading || confirm !== "ELIMINAR"} className="gap-2">
              <UserX className="w-4 h-4" /> {loading ? "Eliminando..." : "Eliminar cuenta"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const [roleFormOpen, setRoleFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [changePassOpen, setChangePassOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [confirmState, setConfirmState] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: roles = [] } = useQuery({
    queryKey: ["userRoles"],
    queryFn: () => base44.entities.UserRole.list("-created_date"),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  const updateUserRole = useMutation({
    mutationFn: ({ id, role }) => base44.entities.User.update(id, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });

  const createRole = useMutation({
    mutationFn: (d) => base44.entities.UserRole.create(d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["userRoles"] }),
  });
  const updateRole = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UserRole.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["userRoles"] }),
  });
  const deleteRole = useMutation({
    mutationFn: (id) => base44.entities.UserRole.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["userRoles"] }),
  });

  const handleRoleSubmit = (data) => {
    editingRole ? updateRole.mutate({ id: editingRole.id, data }) : createRole.mutate(data);
    setEditingRole(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
          <p className="text-muted-foreground mt-1">Administra usuarios, roles y permisos del sistema</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setChangePassOpen(true)} className="gap-2">
            <KeyRound className="w-4 h-4" /> Cambiar mi Clave
          </Button>
          <Button variant="outline" onClick={() => setDeleteAccountOpen(true)} className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10">
            <UserX className="w-4 h-4" /> Eliminar Cuenta
          </Button>
          <Button variant="outline" onClick={() => { setEditingRole(null); setRoleFormOpen(true); }} className="gap-2">
            <Shield className="w-4 h-4" /> Nuevo Rol
          </Button>
          <Button onClick={() => setCreateUserOpen(true)} className="gap-2">
            <UserPlus className="w-4 h-4" /> Crear Usuario
          </Button>
        </div>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users" className="gap-2"><Users className="w-4 h-4" /> Usuarios</TabsTrigger>
          <TabsTrigger value="roles" className="gap-2"><Shield className="w-4 h-4" /> Roles y Permisos</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <div className="bg-card rounded-2xl border overflow-hidden">
            {users.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">No hay usuarios registrados</div>
            ) : (
              <div className="divide-y">
                {users.map((u) => (
                  <div key={u.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-muted/20">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                        {(u.full_name || u.email || "?")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {/^\d{8}$/.test(u.full_name) ? `DNI: ${u.full_name}` : (u.full_name || "Sin nombre")}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      <Badge className={u.role === "admin" ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"}>
                        {u.role === "admin" ? "Administrador" : "Usuario"}
                      </Badge>
                      {u.id === currentUser?.id && (
                        <Badge variant="outline" className="text-xs">Tú</Badge>
                      )}
                      {u.id === currentUser?.id && (
                        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs"
                          onClick={() => setChangePassOpen(true)}>
                          <KeyRound className="w-3 h-3" /> Cambiar clave
                        </Button>
                      )}
                      {currentUser?.role === "admin" && u.id !== currentUser?.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            const newRole = u.role === "admin" ? "user" : "admin";
                            const label = newRole === "admin" ? "Administrador" : "Usuario";
                            setConfirmState({
                              title: "Cambiar rol de usuario",
                              description: `¿Cambiar el rol de ${u.full_name || u.email} a "${label}"?`,
                              onConfirm: () => updateUserRole.mutate({ id: u.id, role: newRole }),
                            });
                          }}
                        >
                          {u.role === "admin" ? "Quitar admin" : "Hacer admin"}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="roles" className="mt-4">
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { name: "Administrador", description: "Acceso total al sistema", permissions: ALL_PERMISSIONS.map(p => p.id), color: "#4F63D2", builtin: true },
                { name: "Usuario", description: "Acceso básico según asignación", permissions: ["dashboard", "planilla", "finanzas"], color: "#10b981", builtin: true },
              ].map((role) => (
                <Card key={role.name} className="p-4 border-2" style={{ borderColor: role.color + "30" }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }} />
                      <span className="font-semibold">{role.name}</span>
                      <Badge variant="secondary" className="text-xs">Predefinido</Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{role.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {ALL_PERMISSIONS.filter(p => role.permissions.includes(p.id)).map(p => (
                      <Badge key={p.id} variant="outline" className="text-xs">{p.label}</Badge>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
            {roles.map((role) => (
              <Card key={role.id} className="p-4 border-2" style={{ borderColor: (role.color || "#4F63D2") + "30" }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color || "#4F63D2" }} />
                    <span className="font-semibold">{role.name}</span>
                    <Badge variant="outline" className="text-xs">Personalizado</Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7"
                      onClick={() => { setEditingRole(role); setRoleFormOpen(true); }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => deleteRole.mutate(role.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                {role.description && <p className="text-xs text-muted-foreground mb-2">{role.description}</p>}
                <div className="flex flex-wrap gap-1">
                  {(role.permissions || []).map((pid) => {
                    const perm = ALL_PERMISSIONS.find(p => p.id === pid);
                    return perm ? <Badge key={pid} variant="outline" className="text-xs">{perm.label}</Badge> : null;
                  })}
                </div>
              </Card>
            ))}
            {roles.length === 0 && (
              <Card className="p-8 text-center text-muted-foreground">
                No hay roles personalizados. Crea uno con el botón "Nuevo Rol".
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <RoleForm open={roleFormOpen} onClose={() => { setRoleFormOpen(false); setEditingRole(null); }}
        onSubmit={handleRoleSubmit} editing={editingRole} />
      <CreateUserDialog open={createUserOpen} onClose={() => setCreateUserOpen(false)} />
      <ChangePasswordDialog open={changePassOpen} onClose={() => setChangePassOpen(false)} />
      <DeleteAccountDialog open={deleteAccountOpen} onClose={() => setDeleteAccountOpen(false)} currentUser={currentUser} />
      <ConfirmDialog
        open={!!confirmState}
        onOpenChange={(o) => { if (!o) setConfirmState(null); }}
        title={confirmState?.title}
        description={confirmState?.description}
        onConfirm={() => { confirmState?.onConfirm(); setConfirmState(null); }}
        confirmLabel="Confirmar"
      />
    </div>
  );
}