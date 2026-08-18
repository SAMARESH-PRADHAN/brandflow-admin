import { useEffect, useMemo, useState } from "react";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";
import { PageShell } from "@/components/admin/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  fetchMoqSettings,
  upsertMoqSetting,
  type MoqSetting,
  fetchDiscountTiers,
  saveDiscountTiers,
  type DiscountTier,
} from "@/lib/api";
import { CATALOG_TAXONOMY } from "@/lib/catalog-taxonomy";
import { ConfirmButton } from "@/components/admin/confirm-button";


const DEFAULT_MIN_QTY = 5;
const CUSTOM_ACCESSORIES = "Custom Accessories";

const keyFor = (category: string, subCategory?: string | null) =>
  `${category}::${subCategory ?? ""}`;

type EditableTier = { minQty: number; maxQty: number | null; discountPct: number; isBulk: boolean };

const DEFAULT_TIERS: EditableTier[] = [
  { minQty: 5, maxQty: 9, discountPct: 0, isBulk: false },
  { minQty: 10, maxQty: 24, discountPct: 10, isBulk: false },
  { minQty: 25, maxQty: 49, discountPct: 20, isBulk: false },
  { minQty: 50, maxQty: 80, discountPct: 30, isBulk: false },
  { minQty: 81, maxQty: null, discountPct: 40, isBulk: true },
];

function MoqSettingsPage() {
  const [settings, setSettings] = useState<MoqSetting[]>([]);
  const [tiers, setTiers] = useState<DiscountTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [moq, dt] = await Promise.all([fetchMoqSettings(), fetchDiscountTiers()]);
      setSettings(moq);
      setTiers(dt);
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const moqMap = useMemo(() => {
    const m = new Map<string, MoqSetting>();
    settings.forEach((s) => m.set(keyFor(s.category, s.subCategory), s));
    return m;
  }, [settings]);

  const tiersMap = useMemo(() => {
    const m = new Map<string, DiscountTier[]>();
    tiers.forEach((t) => {
      const k = keyFor(t.category, t.subCategory);
      m.set(k, [...(m.get(k) ?? []), t]);
    });
    return m;
  }, [tiers]);

  const saveMoq = async (category: string, subCategory: string | null, minQty: number) => {
    if (!Number.isFinite(minQty) || minQty < 1)
      return toast.error("Minimum quantity must be at least 1");
    const k = keyFor(category, subCategory);
    setSavingKey(k);
    try {
      const saved = await upsertMoqSetting({ category, subCategory, minQty });
      setSettings((prev) => [
        ...prev.filter((s) => keyFor(s.category, s.subCategory) !== k),
        saved,
      ]);
      toast.success("Minimum quantity updated");
    } catch {
      toast.error("Failed to save minimum quantity");
    } finally {
      setSavingKey(null);
    }
  };

  const saveTiers = async (category: string, subCategory: string | null, list: EditableTier[]) => {
    const k = keyFor(category, subCategory);
    setSavingKey(k + ":tiers");
    try {
      const saved = await saveDiscountTiers({ category, subCategory, tiers: list });
      setTiers((prev) => [
        ...prev.filter((t) => keyFor(t.category, t.subCategory) !== k),
        ...saved,
      ]);
      toast.success("Discount tiers updated");
    } catch {
      toast.error("Failed to save discount tiers");
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return (
      <PageShell
        title="Minimum Order Quantities & Discounts"
        subtitle="Set MOQ and discount tiers per category"
      >
        <div className="flex justify-center py-20 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      </PageShell>
    );
  }

  const renderBucket = (category: string, subCategory: string | null, label?: string) => {
    const k = keyFor(category, subCategory);
    const existingTiers = tiersMap.get(k);
    return (
      <div key={k} className="rounded-lg bg-secondary/30 p-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs">{label ?? category}</Label>
          <div className="flex items-center gap-3">
            <MoqField
              value={moqMap.get(k)?.minQty ?? DEFAULT_MIN_QTY}
              saving={savingKey === k}
              onSave={(v) => saveMoq(category, subCategory, v)}
            />
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => setExpandedKey(expandedKey === k ? null : k)}
            >
              Discount Tiers ({existingTiers?.length ?? 0})
            </Button>
          </div>
        </div>
        {expandedKey === k && (
          <TierEditor
            initial={existingTiers?.length ? existingTiers : DEFAULT_TIERS}
            saving={savingKey === k + ":tiers"}
            onSave={(list) => saveTiers(category, subCategory, list)}
          />
        )}
      </div>
    );
  };

  return (
    <PageShell
      title="Minimum Order Quantities & Discounts"
      subtitle="Set MOQ and quantity discount tiers per category. Custom Accessories can be set per item."
    >
      <div className="space-y-3">
        {CATALOG_TAXONOMY.map((cat) => (
          <div key={cat.name} className="rounded-xl border border-border p-4">
            <div className="mb-3 text-sm font-semibold">{cat.name}</div>
            {cat.name !== CUSTOM_ACCESSORIES ? (
              renderBucket(cat.name, null)
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {(cat.items ?? []).map((item) => renderBucket(cat.name, item, item))}
              </div>
            )}
          </div>
        ))}
      </div>
    </PageShell>
  );
}

function MoqField({
  value,
  saving,
  onSave,
}: {
  value: number;
  saving: boolean;
  onSave: (v: number) => void;
}) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <div className="flex items-center gap-2">
      <Label className="text-[10px] uppercase text-muted-foreground">MOQ</Label>
      <Input
        type="number"
        min={1}
        value={v}
        onChange={(e) => setV(Number(e.target.value))}
        className="h-8 w-16 text-xs"
      />
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        disabled={saving || v === value}
        onClick={() => onSave(v)}
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      </Button>
    </div>
  );
}

function TierEditor({
  initial,
  saving,
  onSave,
}: {
  initial: EditableTier[];
  saving: boolean;
  onSave: (list: EditableTier[]) => void;
}) {
  const [rows, setRows] = useState<EditableTier[]>(initial);

  const update = (i: number, patch: Partial<EditableTier>) =>
    setRows((prev) =>
      prev.map((r, idx) => {
        if (idx !== i) return r;
        const next = { ...r, ...patch };
        if (next.minQty <= 80 && next.isBulk) next.isBulk = false;
        return next;
      }),
    );
  const addRow = () =>
    setRows((prev) => [...prev, { minQty: 1, maxQty: null, discountPct: 0, isBulk: false }]);

  const removeRow = (i: number) => setRows((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <div className="mt-3 space-y-2 border-t border-border pt-3">
      {rows.map((r, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">From</span>
          <Input
            type="number"
            min={1}
            value={r.minQty}
            className="h-7 w-16"
            onChange={(e) => update(i, { minQty: Number(e.target.value) })}
          />
          <span className="text-muted-foreground">to</span>
          <Input
            type="number"
            min={1}
            placeholder="∞"
            value={r.maxQty ?? ""}
            className="h-7 w-16"
            onChange={(e) =>
              update(i, { maxQty: e.target.value === "" ? null : Number(e.target.value) })
            }
          />
          <span className="text-muted-foreground">pcs →</span>
          <Input
            type="number"
            min={0}
            max={100}
            value={r.discountPct}
            className="h-7 w-16"
            onChange={(e) => update(i, { discountPct: Number(e.target.value) })}
          />
          <span className="text-muted-foreground">%</span>
          {r.minQty > 80 && (
            <label className="flex items-center gap-1 text-[10px] uppercase text-muted-foreground">
              <input
                type="checkbox"
                checked={r.isBulk}
                onChange={(e) =>
                  update(i, {
                    isBulk: e.target.checked,
                    maxQty: e.target.checked ? null : r.maxQty,
                  })
                }
              />
              Bulk tier
            </label>
          )}
          <ConfirmButton
            trigger={
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            }
            title="Remove this tier?"
            description={`This will remove the ${r.minQty}${r.maxQty ? `–${r.maxQty}` : "+"} pcs tier (${r.discountPct}% discount) from the list. You'll still need to click "Save tiers" to persist the change.`}
            onConfirm={() => removeRow(i)}
          />
        </div>
      ))}
      <div className="flex items-center gap-2 pt-1">
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={addRow}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Add tier
        </Button>
        <Button size="sm" className="h-7 text-xs" disabled={saving} onClick={() => onSave(rows)}>
          {saving ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="mr-1 h-3.5 w-3.5" />
          )}
          Save tiers
        </Button>
      </div>
    </div>
  );
}

export default MoqSettingsPage;
