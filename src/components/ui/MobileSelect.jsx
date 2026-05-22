import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Check } from "lucide-react";

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 1024);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 1024);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
}

/**
 * MobileSelect – uses a bottom Drawer on mobile, standard Select on desktop.
 * Props mirror a subset of shadcn Select:
 *   value, onValueChange, placeholder, triggerClassName, label
 *   options: [{ value, label }]
 */
export default function MobileSelect({ value, onValueChange, options = [], placeholder = "Seleccionar", triggerClassName = "", label }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const selectedLabel = options.find((o) => o.value === value)?.label || placeholder;

  if (!isMobile) {
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={triggerClassName}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex items-center justify-between px-3 bg-background border rounded-md text-sm h-10 min-h-[44px] w-full ${triggerClassName}`}
      >
        <span className={value ? "" : "text-muted-foreground"}>{selectedLabel}</span>
        <svg className="w-4 h-4 opacity-50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          {label && (
            <DrawerHeader className="pb-2">
              <DrawerTitle className="text-base">{label}</DrawerTitle>
            </DrawerHeader>
          )}
          <div className="px-4 pb-6 space-y-1 overflow-y-auto max-h-[60vh]">
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onValueChange(o.value); setOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm min-h-[44px] transition-colors
                  ${value === o.value ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted"}`}
              >
                {o.label}
                {value === o.value && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}