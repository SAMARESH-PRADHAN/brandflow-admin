import { useEffect, useMemo, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { PageShell } from "@/components/admin/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { fetchMoqSettings, upsertMoqSetting, type MoqSetting } from "@/lib/api";
import { CATALOG_TAXONOMY } from "@/lib/catalog-taxonomy";

const DEFAULT_MIN_QTY = 5;
const CUSTOM_ACCESSORIES = "Custom Accessories";

const keyFor = (category: string, subCategory?: string | null) => `${category}::${subCategory ?? ""}`;

function MoqSettingsPage() {
  const [settings, setSettings] = useState<MoqSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setSettings(await fetchMoqSettings());
    } catch {
      toast.error("Failed to load minimum quantity settings");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const map = useMemo(() => {
    const m = new Map<string, MoqSetting>();
    settings.forEach((s) => m.set(keyFor(s.category, s.subCategory), s));
    return m;
  }, [settings]);

  const save = async (category: string, subCategory: string | null, minQty: number) => {
    if (!Number.isFinite(minQty) || minQty < 1) {
      toast.error("Minimum quantity must be at least 1");
      return;
    }
    const k = keyFor(category, subCategory);
    setSavingKey(k);
    try {
      const saved = await upsertMoqSetting({ category, subCategory, minQty });
      setSettings((prev) => [...prev.filter((s) => keyFor(s.category, s.subCategory) !== k), saved]);
      toast.success("Minimum quantity updated");
    } catch {
      toast.error("Failed to save minimum quantity");
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return (
      <PageShell title="Minimum Order Quantities" subtitle="Set MOQ per category">
        <div className="flex justify-center py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Minimum Order Quantities"
      subtitle="Set the minimum quantity per category. Custom Accessories can be set per item."
    >
      <div className="space-y-3">
        {CATALOG_TAXONOMY.map((cat) => (
          <div key={cat.name} className="rounded-xl border border-border p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold">{cat.name}</div>
              {cat.name !== CUSTOM_ACCESSORIES && (
                <MoqField
                  value={map.get(keyFor(cat.name, null))?.minQty ?? DEFAULT_MIN_QTY}
                  saving={savingKey === keyFor(cat.name, null)}
                  onSave={(v) => save(cat.name, null, v)}
                />
              )}
            </div>

            {cat.name === CUSTOM_ACCESSORIES && (
              <div className="grid gap-2 sm:grid-cols-2">
                {(cat.items ?? []).map((item) => (
                  <div key={item} className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2">
                    <Label className="text-xs">{item}</Label>
                    <MoqField
                      value={map.get(keyFor(cat.name, item))?.minQty ?? DEFAULT_MIN_QTY}
                      saving={savingKey === keyFor(cat.name, item)}
                      onSave={(v) => save(cat.name, item, v)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </PageShell>
  );
}

function MoqField({ value, saving, onSave }: { value: number; saving: boolean; onSave: (v: number) => void }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <div className="flex items-center gap-2">
      <Input type="number" min={1} value={v} onChange={(e) => setV(Number(e.target.value))} className="h-8 w-20 text-xs" />
      <Button size="icon" variant="ghost" className="h-8 w-8" disabled={saving || v === value} onClick={() => onSave(v)}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      </Button>
    </div>
  );
}

export default MoqSettingsPage;