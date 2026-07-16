import { useState, useEffect } from "react";
import { Save, RefreshCw, Trash2 } from "lucide-react";
import { PageShell } from "@/components/admin/page-shell";
import { SectionCard } from "@/components/admin/section-card";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/hooks/use-theme";
import { KEYS, readCollection, resetDemoData, type Settings } from "@/lib/store";
import { toast } from "sonner";


function SettingsPage() {
  const { theme, toggle } = useTheme();
  const [s, setS] = useState<Settings>({ brand: "Arreniux", email: "", phone: "", address: "", currency: "INR", theme: "light" });

  useEffect(() => {
    const raw = readCollection<Settings>(KEYS.settings);
    if (raw && !Array.isArray(raw) && Object.keys(raw).length) {
      // stored as object, but readCollection returns array — handle both
    }
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("arreniux:" + KEYS.settings);
        if (stored) setS(JSON.parse(stored));
      } catch {}
    }
  }, []);

  const save = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("arreniux:" + KEYS.settings, JSON.stringify(s));
      window.dispatchEvent(new CustomEvent("arreniux:change", { detail: { key: KEYS.settings } }));
    }
    toast.success("Settings saved");
  };

  return (
    <PageShell title="Settings" subtitle="Demo configuration for the Arreniux Admin Panel">
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Brand Information" subtitle="Displayed across the panel">
          <div className="space-y-3">
            <div className="space-y-1.5"><Label className="text-xs">Brand Name</Label><Input value={s.brand} onChange={(e) => setS({ ...s, brand: e.target.value })} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Contact Email</Label><Input type="email" value={s.email} onChange={(e) => setS({ ...s, email: e.target.value })} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Phone</Label><Input value={s.phone} onChange={(e) => setS({ ...s, phone: e.target.value })} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Address</Label><Input value={s.address} onChange={(e) => setS({ ...s, address: e.target.value })} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Currency</Label><Input value={s.currency} onChange={(e) => setS({ ...s, currency: e.target.value })} /></div>
            <Button onClick={save}><Save className="mr-1 h-4 w-4" /> Save Changes</Button>
          </div>
        </SectionCard>

        <SectionCard title="Appearance" subtitle="Theme preferences">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <div className="text-sm font-semibold">Dark Mode</div>
              <div className="text-xs text-muted-foreground">Currently: {theme}</div>
            </div>
            <Switch checked={theme === "dark"} onCheckedChange={toggle} />
          </div>
        </SectionCard>

        <SectionCard title="Demo Data" subtitle="Reset LocalStorage to fresh seed data" className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              This will erase all products, orders, customers, payments and reviews and re-seed the demo dataset.
            </div>
            <ConfirmButton
              trigger={<Button variant="outline" className="text-destructive"><RefreshCw className="mr-1 h-4 w-4" /> Reset Demo Data</Button>}
              title="Reset all demo data?" description="Every module will be re-seeded. This cannot be undone."
              confirmText="Reset"
              onConfirm={() => { resetDemoData(); toast.success("Demo data reset"); }}
            />
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}

export default SettingsPage;
