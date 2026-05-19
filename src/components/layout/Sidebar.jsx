import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, ArrowUpDown, Tag, Minus, Receipt, X, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/planilla", label: "Planilla", icon: Users },
  { path: "/finanzas", label: "Ingresos y Gastos", icon: ArrowUpDown },
  { path: "/categorias", label: "Categorías", icon: Tag },
  { path: "/descuentos", label: "Descuentos y Adelantos", icon: Minus },
  { path: "/gastos-fijos", label: "Gastos Fijos", icon: Receipt },
  { path: "/usuarios", label: "Usuarios", icon: ShieldCheck },
];

export default function Sidebar({ open, onClose }) {
  const location = useLocation();

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">GT</span>
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight">Gestec</h1>
              <p className="text-[10px] text-sidebar-foreground/50 uppercase tracking-widest">Sistema</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 mt-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent text-primary"
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mx-3 mb-4 rounded-xl bg-sidebar-accent/50">
          <p className="text-xs text-sidebar-foreground/50">© 2026 Gestec</p>
        </div>
      </aside>
    </>
  );
}