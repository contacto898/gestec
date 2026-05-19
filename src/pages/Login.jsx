import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, IdCard, Lock, Loader2, Info } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

// If the input is exactly 8 digits, treat it as DNI and convert to internal email
function resolveLogin(input) {
  if (/^\d{8}$/.test(input.trim())) return `${input.trim()}@usuario.interno`;
  return input.trim();
}

export default function Login() {
  const [searchParams] = useSearchParams();
  const isInvited = searchParams.get("invited") === "true";
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const email = resolveLogin(identifier);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = "/";
    } catch (err) {
      setError("DNI/correo o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={LogIn}
      title="Iniciar Sesión"
      subtitle="Ingresa con tu DNI o correo y contraseña"
      footer={
        <>
          ¿Olvidaste tu contraseña?{" "}
          <Link to="/forgot-password" className="text-primary font-medium hover:underline">
            Recuperar acceso
          </Link>
        </>
      }
    >
      {isInvited && (
        <div className="mb-4 p-3 rounded-lg bg-blue-50 text-blue-700 text-sm flex gap-2">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            <strong>¿Primera vez?</strong> Primero debes crear tu contraseña. Haz clic en{" "}
            <Link to="/forgot-password" className="underline font-medium">Recuperar acceso</Link>,
            ingresa tu correo y recibirás un enlace para establecerla.
          </span>
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="identifier">DNI o Correo electrónico</Label>
          <div className="relative">
            <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="identifier" type="text" autoComplete="username" autoFocus
              placeholder="12345678 o correo@ejemplo.com" value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="pl-10 h-12" required />
          </div>
          <p className="text-xs text-muted-foreground">Usuarios creados con DNI: ingresa solo los 8 dígitos</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="password" type="password" autoComplete="current-password"
              placeholder="••••••••" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12" required />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Ingresando...</> : "Ingresar"}
        </Button>
      </form>
    </AuthLayout>
  );
}