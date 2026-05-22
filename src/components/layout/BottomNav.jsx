import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";

// Module-level memory: persists across re-renders, resets on full page reload
const tabPathMemory = new Map();
import { LayoutDashboard, Users, TrendingUp, CreditCard, ListChecks } from "lucide-react";

const NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Inicio" },
  { to: "/planilla", icon: Users, label: "Planilla" },
  { to: "/finanzas", icon: TrendingUp, label: "Finanzas" },
  { to: "/cuadre-caja", icon: CreditCard, label: "Caja" },
  { to: "/usuarios", icon: ListChecks, label: "Usuarios" },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Keep track of the last visited path per tab root
  useEffect(() => {
    const match = NAV_ITEMS.find(
      (item) => pathname === item.to || pathname.startsWith(item.to === "/" ? "/___never___" : item.to + "/")
    ) || (pathname === "/" ? NAV_ITEMS[0] : null);
    if (match) tabPathMemory.set(match.to, pathname);
  }, [pathname]);

  const handleTabPress = (to) => {
    navigate(tabPathMemory.get(to) || to);
  };

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-stretch">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const active = pathname === to;
          return (
            <button
              key={to}
              type="button"
              onClick={() => handleTabPress(to)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] select-none transition-colors ${
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : ""}`} />
              <span className={`text-[10px] font-medium ${active ? "font-semibold" : ""}`}>{label}</span>
              {active && (
                <span className="absolute bottom-0 w-6 h-0.5 rounded-full bg-primary" style={{ position: "static", display: "block", marginTop: "1px" }} />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}