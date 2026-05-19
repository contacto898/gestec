import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2, IdCard } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import { useToast } from "@/components/ui/use-toast";

export default function Register() {
  const { toast } = useToast();
  const [dni, setDni] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!/^\d{8}$/.test(dni.trim())) {
      setError("El DNI debe tener exactamente 8 dígitos");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email: email.trim(), password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "Error al crear cuenta");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email: email.trim(), otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      // Guardar el DNI en el perfil del usuario
      await base44.auth.updateMe({ dni: dni.trim() });
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Código incorrecto");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email.trim());
      toast({ title: "Código enviado", description: "Revisa tu correo." });
    } catch (err) {
      setError(err.message || "Error al reenviar código");
    }
  };

  if (showOtp) {
    return (
      <AuthLayout
        icon={Mail}
        title="Verifica tu identidad"
        subtitle={`Enviamos un código a ${email.trim()}`}
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}
        <div className="flex justify-center mb-6">
          <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button className="w-full h-12 font-medium" onClick={handleVerify} disabled={loading || otpCode.length < 6}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verificando...</> : "Verificar"}
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-4">
          ¿No recibiste el código?{" "}
          <button onClick={handleResend} className="text-primary font-medium hover:underline">Reenviar</button>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={UserPlus}
      title="Crea tu cuenta"
      subtitle="Ingresa tu DNI y crea una contraseña"
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">Ingresar</Link>
        </>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="dni">DNI</Label>
          <div className="relative">
            <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="dni"
              type="text"
              inputMode="numeric"
              autoFocus
              placeholder="12345678"
              maxLength={8}
              value={dni}
              onChange={(e) => setDni(e.target.value.replace(/\D/g, ""))}
              className="pl-10 h-12"
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">8 dígitos — úsalo para ingresar al sistema</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="email" type="email" autoComplete="email" placeholder="correo@ejemplo.com"
              value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12" required />
          </div>
          <p className="text-xs text-muted-foreground">Aquí recibirás el código de verificación</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="password" type="password" autoComplete="new-password" placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 h-12" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirmar contraseña</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="confirm" type="password" autoComplete="new-password" placeholder="••••••••"
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10 h-12" required />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creando cuenta...</> : "Crear cuenta"}
        </Button>
      </form>
    </AuthLayout>
  );
}