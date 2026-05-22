import { useState, useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import { Menu, LogOut, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

const ROOT_PATHS = ["/", "/planilla", "/finanzas", "/categorias", "/descuentos", "/gastos-fijos", "/usuarios", "/cuadre-caja"];

const PAGE_TITLES = {
  "/": "Dashboard",
  "/planilla": "Planilla",
  "/finanzas": "Finanzas",
  "/categorias": "Categorías",
  "/descuentos": "Descuentos",
  "/gastos-fijos": "Gastos Fijos",
  "/usuarios": "Usuarios",
  "/cuadre-caja": "Cuadre de Caja",
};

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const isRoot = ROOT_PATHS.includes(location.pathname);
  const mainRef = useRef(null);
  const scrollPositions = useRef({});
  const prevPathname = useRef(location.pathname);

  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    scrollPositions.current[prevPathname.current] = main.scrollTop;
    const saved = scrollPositions.current[location.pathname] || 0;
    requestAnimationFrame(() => { main.scrollTop = saved; });
    prevPathname.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header
          className="border-b bg-card flex items-center px-4 gap-3 shrink-0"
          style={{ paddingTop: "env(safe-area-inset-top)", minHeight: "calc(56px + env(safe-area-inset-top))" }}
        >
          {/* Desktop: hamburger menu */}
          <Button variant="ghost" size="icon" className="hidden lg:flex shrink-0" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>

          {/* Mobile: back button or hamburger */}
          {!isRoot ? (
            <Button variant="ghost" size="icon" className="lg:hidden shrink-0" onClick={() => navigate(-1)}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" className="lg:hidden shrink-0" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
          )}

          {/* Mobile: logo + name */}
          <div className="flex-1 min-w-0 lg:hidden flex items-center gap-2">
            <img
              src="https://media.base44.com/images/public/6a0fc6d97f097abb7c26119e/2206e58b8_d49377bb-cc09-42b6-89a3-836b8aaf8960.png"
              alt="GesTec"
              className="h-7 w-auto object-contain"
            />
            <span className="font-bold text-sm tracking-tight">GesTec</span>
          </div>
          <div className="flex-1 min-w-0 hidden lg:block" />

          {user && (
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs shrink-0">
                {(user.full_name || user.email || "?")[0].toUpperCase()}
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-xs font-medium leading-none">{user.full_name || user.email}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{user.role === "admin" ? "Administrador" : "Usuario"}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-11 w-11 text-muted-foreground"
                onClick={() => base44.auth.logout()}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          )}
        </header>

        <main ref={mainRef} className="flex-1 overflow-y-auto p-4 lg:p-6 pb-[calc(1rem+env(safe-area-inset-bottom)+64px)] lg:pb-6 relative">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ x: 24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -24, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}