import { useEffect, useMemo, useState } from "react";
import { Loader2, Save, Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { PageShell } from "@/components/admin/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  fetchPrintSettings,
  upsertPrintSetting,
  deletePrintSetting,
  type PrintSetting,
  type PrintConfigDto,
  type PrintMethodDto,
} from "@/lib/api";
import { CATALOG_TAXONOMY, type Tier } from "@/lib/catalog-taxonomy";
import { ConfirmButton } from "@/components/admin/confirm-button";

const keyFor = (category: string, productType?: string | null, subCategory?: string | null) =>
  `${category}::${productType ?? ""}::${subCategory ?? ""}`;

const DEFAULT_CUSTOM: PrintConfigDto = {
  kind: "custom",
  methods: [
    {
      id: "dtf",
      label: "DTF Print",
      options: [
        { id: "chest", label: "Chest Print (4×4 inch)", pricePerPc: 0 },
        { id: "back-a4", label: "Back Print (A4)", pricePerPc: 40 },
      ],
    },
    {
      id: "embroidery",
      label: "Embroidery Print",
      note: "Supports 1–3 thread color embroidery.",
      options: [{ id: "chest-emb", label: "Chest Logo (1–3 thread colors)", pricePerPc: 20 }],
    },
    {
      id: "sublimation",
      label: "Sublimation Print",
      options: [{ id: "sub-a4", label: "Sublimation A4 Print", pricePerPc: 30 }],
    },
  ],
};

function PrintSettingsPage() {
  const [settings, setSettings] = useState<PrintSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    try {
      setSettings(await fetchPrintSettings());
    } catch {
      toast.error("Failed to load print settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const map = useMemo(() => {
    const m = new Map<string, PrintSetting>();
    settings.forEach((s) => m.set(keyFor(s.category, s.productType, s.subCategory), s));
    return m;
  }, [settings]);

  const save = async (
    category: string,
    productType: string | null,
    subCategory: string | null,
    config: PrintConfigDto,
  ) => {
    const k = keyFor(category, productType, subCategory);
    setSavingKey(k);
    try {
      const saved = await upsertPrintSetting({
        category,
        productType,
        subCategory,
        config,
      });
      setSettings((prev) => [
        ...prev.filter((s) => keyFor(s.category, s.productType, s.subCategory) !== k),
        saved,
      ]);
      toast.success("Print settings saved");
    } catch {
      toast.error("Failed to save print settings");
    } finally {
      setSavingKey(null);
    }
  };

  const remove = async (
    category: string,
    productType: string | null,
    subCategory: string | null,
  ) => {
    const existing = map.get(keyFor(category, productType, subCategory));
    if (!existing) return;
    try {
      await deletePrintSetting(existing.id);
      setSettings((prev) => prev.filter((s) => s.id !== existing.id));
      toast.success("Override removed");
    } catch {
      toast.error("Failed to delete");
    }
  };

  if (loading) {
    return (
      <PageShell title="Print Settings" subtitle="Print types & prices">
        <div className="flex justify-center py-20 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      </PageShell>
    );
  }

  const renderBucket = (
    category: string,
    productType: string | null,
    subCategory: string | null,
    label: string,
    level: "category" | "type" | "sub" = "sub",
  ) => {
    const k = keyFor(category, productType, subCategory);
    const existing = map.get(k);
    const open = expandedKey === k;
    const kind = existing?.config.kind ?? null;

    const levelStyles = {
      category: "border-l-4 border-l-blue-500 bg-blue-500/5",
      type: "border-l-4 border-l-violet-500 bg-violet-500/5",
      sub: "border-l-4 border-l-emerald-500 bg-emerald-500/5",
    }[level];

    const kindBadge = !kind ? (
      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        Default (fallback)
      </span>
    ) : kind === "none" ? (
      <span className="rounded-full bg-slate-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
        No print
      </span>
    ) : kind === "free" ? (
      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
        Free
      </span>
    ) : (
      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
        Custom · paid
      </span>
    );

    return (
      <div
        key={k}
        className={`rounded-lg border border-border/60 p-3 transition-colors ${levelStyles} ${
          open ? "ring-1 ring-primary/30 shadow-sm" : ""
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Label className="text-xs font-medium">{label}</Label>
              {kindBadge}
              {existing && (
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-primary">
                  Override active
                </span>
              )}
            </div>
            {(productType || subCategory) && (
              <div className="mt-0.5 text-[10px] text-muted-foreground">
                {[productType, subCategory].filter(Boolean).join(" → ")}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={open ? "secondary" : "outline"}
              className="h-8 text-xs"
              onClick={() => setExpandedKey(open ? null : k)}
            >
              {open ? "Close" : existing ? "Edit print" : "Set print"}
            </Button>
            {existing && (
              <ConfirmButton
                trigger={
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Reset
                  </Button>
                }
                title="Remove this print override?"
                description={`“${label}” will fall back to parent level or hardcoded storefront defaults. This cannot be undone.`}
                confirmText="Yes, reset"
                onConfirm={() => remove(category, productType, subCategory)}
              />
            )}
          </div>
        </div>
        {open && (
          <PrintConfigEditor
            initial={existing?.config ?? DEFAULT_CUSTOM}
            saving={savingKey === k}
            onSave={(config) => save(category, productType, subCategory, config)}
          />
        )}
      </div>
    );
  };

   return (
    <PageShell
      title="Print Settings"
      subtitle="Set print methods, options and prices for every category, type (Regular/Premium), and subcategory."
    >
      {/* ===== PASTE LEGEND HERE (STEP 7) ===== */}
      <div className="mb-4 flex flex-wrap gap-3 rounded-lg border border-border bg-secondary/40 px-4 py-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-1 rounded bg-blue-500" /> Category default
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-1 rounded bg-violet-500" /> Type (Regular/Premium)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-1 rounded bg-emerald-500" /> Subcategory
        </span>
        <span className="flex items-center gap-1.5">
          <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">
            Custom
          </span>
          Paid options
        </span>
        <span className="flex items-center gap-1.5">
          <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">
            Free
          </span>
          No charge
        </span>
        <span className="flex items-center gap-1.5">
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
            Override active
          </span>
          Saved in admin
        </span>
      </div>
      {/* ===== END LEGEND ===== */}

      <div className="space-y-3">
        {CATALOG_TAXONOMY.map((cat) => {
          const catOpen = openCats[cat.name] ?? false;
          return (
            <div key={cat.name} className="rounded-xl border border-border p-4">
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left text-sm font-semibold transition hover:bg-secondary/50"
                onClick={() => setOpenCats((p) => ({ ...p, [cat.name]: !catOpen }))}
              >
                {catOpen ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-primary" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className="truncate">{cat.name}</span>
                <span
                  className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                    cat.hasTiers
                      ? "bg-violet-500/15 text-violet-700 dark:text-violet-300"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {cat.hasTiers ? "Regular + Premium" : "No tiers"}
                </span>
              </button>

              {catOpen && (
                <div className="mt-3 space-y-4">
                  {/* Category-wide default (no type, no sub) */}
                  {renderBucket(
                    cat.name,
                    null,
                    null,
                    "Category default (all types/subs)",
                    "category",
                  )}

                  {cat.hasTiers ? (
                    (["Regular", "Premium"] as Tier[]).map((tier) => {
                      const subs = (tier === "Premium" ? cat.premium : cat.regular) ?? [];
                      return (
                        <div key={tier} className="space-y-2">
                                 <div className="flex items-center gap-2 border-b border-border pb-1.5">
          <span
            className={`h-2 w-2 rounded-full ${
              tier === "Premium" ? "bg-amber-500" : "bg-sky-500"
            }`}
          />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {tier}
          </span>
        </div>  
                          {/* Type-level default (no sub) */}
                          {renderBucket(
                            cat.name,
                            tier,
                            null,
                            `${tier} default (all ${tier} subcategories)`,
                            "type",
                          )}
                          {subs.map((sub) => renderBucket(cat.name, tier, sub, sub, "sub"))}
                        </div>
                      );
                    })
                  ) : (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-1">
                        Subcategories
                      </div>
                      {(cat.items ?? []).map((sub) =>
                        renderBucket(cat.name, null, sub, sub, "sub"),
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}

function PrintConfigEditor({
  initial,
  saving,
  onSave,
}: {
  initial: PrintConfigDto;
  saving: boolean;
  onSave: (c: PrintConfigDto) => void;
}) {
  const [kind, setKind] = useState<PrintConfigDto["kind"]>(initial.kind);
  const [freeLabel, setFreeLabel] = useState(
    initial.kind === "free" ? initial.label : "Company Logo Printing — FREE",
  );
  const [methods, setMethods] = useState<PrintMethodDto[]>(
    initial.kind === "custom"
      ? initial.methods
      : DEFAULT_CUSTOM.kind === "custom"
        ? DEFAULT_CUSTOM.methods
        : [],
  );

  const updateMethod = (i: number, patch: Partial<PrintMethodDto>) =>
    setMethods((prev) => prev.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));

  const updateOption = (
    mi: number,
    oi: number,
    patch: Partial<{ id: string; label: string; pricePerPc: number }>,
  ) =>
    setMethods((prev) =>
      prev.map((m, i) =>
        i !== mi
          ? m
          : {
              ...m,
              options: m.options.map((o, j) => (j === oi ? { ...o, ...patch } : o)),
            },
      ),
    );

  const handleSave = () => {
    if (kind === "none") return onSave({ kind: "none" });
    if (kind === "free") return onSave({ kind: "free", label: freeLabel.trim() || "FREE" });
    onSave({ kind: "custom", methods });
  };

  return (
    <div className="mt-3 space-y-3 border-t border-border pt-3">
      <div className="flex flex-wrap gap-2">
        {(
          [
            { k: "none" as const, label: "No print", cls: "data-[on=true]:bg-slate-600" },
            { k: "free" as const, label: "Free print", cls: "data-[on=true]:bg-emerald-600" },
            { k: "custom" as const, label: "Custom (paid)", cls: "data-[on=true]:bg-amber-600" },
          ] as const
        ).map(({ k, label, cls }) => (
          <Button
            key={k}
            size="sm"
            variant={kind === k ? "default" : "outline"}
            data-on={kind === k}
            className={`h-8 text-xs ${kind === k ? cls : ""}`}
            onClick={() => setKind(k)}
          >
            {label}
          </Button>
        ))}
      </div>

      {kind === "none" && <p className="text-xs text-muted-foreground">No print for this level.</p>}

      {kind === "free" && (
        <div className="flex items-center gap-2">
          <Label className="text-xs whitespace-nowrap">Free label</Label>
          <Input
            value={freeLabel}
            onChange={(e) => setFreeLabel(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
      )}

      {kind === "custom" && (
        <div className="space-y-4">
          {methods.map((m, mi) => (
            <div
              key={mi}
              className="space-y-2 rounded-md border border-border bg-background/80 p-3 shadow-sm"
            >
              <div className="flex flex-wrap gap-2 items-center">
                <Input
                  placeholder="method id"
                  value={m.id}
                  className="h-7 w-28 text-xs"
                  onChange={(e) => updateMethod(mi, { id: e.target.value })}
                />
                <Input
                  placeholder="Method label"
                  value={m.label}
                  className="h-7 flex-1 min-w-[140px] text-xs"
                  onChange={(e) => updateMethod(mi, { label: e.target.value })}
                />
                <Input
                  placeholder="Note"
                  value={m.note ?? ""}
                  className="h-7 flex-1 min-w-[100px] text-xs"
                  onChange={(e) => updateMethod(mi, { note: e.target.value || undefined })}
                />
                <ConfirmButton
                  trigger={
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  }
                  title="Delete this print method?"
                  description={`Remove “${m.label || m.id}” and all its options from this config.`}
                  confirmText="Delete method"
                  onConfirm={() => setMethods((prev) => prev.filter((_, i) => i !== mi))}
                />
              </div>

              {m.options.map((o, oi) => (
                <div key={oi} className="flex flex-wrap gap-2 items-center pl-2">
                  <Input
                    placeholder="option id"
                    value={o.id}
                    className="h-7 w-28 text-xs"
                    onChange={(e) => updateOption(mi, oi, { id: e.target.value })}
                  />
                  <Input
                    placeholder="Option label"
                    value={o.label}
                    className="h-7 flex-1 min-w-[140px] text-xs"
                    onChange={(e) => updateOption(mi, oi, { label: e.target.value })}
                  />
                  <Input
                    type="number"
                    min={0}
                    value={o.pricePerPc}
                    className="h-7 w-20 text-xs"
                    onChange={(e) =>
                      updateOption(mi, oi, { pricePerPc: Number(e.target.value) || 0 })
                    }
                  />
                  <span className="text-[10px] text-muted-foreground">₹/pc</span>
                  <ConfirmButton
                    trigger={
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    }
                    title="Delete this option?"
                    description={`Remove “${o.label || o.id}” (₹${o.pricePerPc}/pc).`}
                    confirmText="Delete option"
                    onConfirm={() =>
                      setMethods((prev) =>
                        prev.map((mm, i) =>
                          i !== mi
                            ? mm
                            : {
                                ...mm,
                                options: mm.options.filter((_, j) => j !== oi),
                              },
                        ),
                      )
                    }
                  />
                </div>
              ))}

              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs ml-2"
                onClick={() =>
                  setMethods((prev) =>
                    prev.map((mm, i) =>
                      i !== mi
                        ? mm
                        : {
                            ...mm,
                            options: [
                              ...mm.options,
                              {
                                id: `opt-${Date.now()}`,
                                label: "New option",
                                pricePerPc: 0,
                              },
                            ],
                          },
                    ),
                  )
                }
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Option
              </Button>
            </div>
          ))}

          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() =>
              setMethods((prev) => [
                ...prev,
                {
                  id: `method-${Date.now()}`,
                  label: "New Print Method",
                  options: [{ id: "opt-1", label: "Option 1", pricePerPc: 0 }],
                },
              ])
            }
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Add method
          </Button>
        </div>
      )}

      <Button
        size="sm"
        className="h-9 text-xs font-semibold"
        disabled={saving}
        onClick={handleSave}
      >
        {saving ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Save className="mr-1.5 h-3.5 w-3.5" />
        )}
        Save print settings
      </Button>
    </div>
  );
}

export default PrintSettingsPage;
