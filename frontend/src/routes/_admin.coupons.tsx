import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Ticket, Eye } from "lucide-react";
import { PageShell } from "@/components/admin/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  fetchCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  fetchCouponUsages,
  type Coupon,
  type CouponUsage,
} from "@/lib/api";
import { ConfirmButton } from "@/components/admin/confirm-button";

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [usages, setUsages] = useState<CouponUsage[]>([]);
  const [viewingId, setViewingId] = useState<string | null>(null);

  // form state
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [discountType, setDiscountType] = useState<"fixed" | "percent">("fixed");
  const [discountValue, setDiscountValue] = useState<number>(100);
  const [minOrder, setMinOrder] = useState<number>(0);
  const [maxUses, setMaxUses] = useState<string>(""); // empty = unlimited
  const [durationMode, setDurationMode] = useState<"long" | "manual">("long");
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchCoupons();
      setCoupons(data);
    } catch {
      toast.error("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setCode("");
    setName("");
    setDiscountType("fixed");
    setDiscountValue(100);
    setMinOrder(0);
    setMaxUses("");
    setDurationMode("long");
    setStartsAt("");
    setExpiresAt("");
  };

  const handleSave = async () => {
    if (!code.trim() || !name.trim()) {
      return toast.error("Code and Name are required");
    }
    if (discountValue <= 0) return toast.error("Discount value must be > 0");

    setSaving(true);
    try {
      await createCoupon({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        discountType,
        discountValue,
        minOrderAmount: minOrder,
        maxUses: maxUses === "" ? null : Number(maxUses),
        startsAt: durationMode === "manual" && startsAt ? startsAt : undefined,
        expiresAt: durationMode === "manual" && expiresAt ? expiresAt : null,
        isActive: true,
      });
      toast.success("Coupon created");
      resetForm();
      load();
    } catch (e: any) {
      toast.error(e?.message || "Failed to create coupon");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (c: Coupon) => {
    try {
      await updateCoupon(c.id, { isActive: !c.isActive } as any);
      toast.success(c.isActive ? "Coupon deactivated" : "Coupon activated");
      load();
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCoupon(id);
      toast.success("Coupon deleted");
      load();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleViewUsages = async (id: string) => {
    if (viewingId === id) {
      setViewingId(null);
      setUsages([]);
      return;
    }
    try {
      const data = await fetchCouponUsages(id);
      setUsages(data);
      setViewingId(id);
    } catch {
      toast.error("Failed to load usages");
    }
  };

  if (loading) {
    return (
      <PageShell title="Coupon Codes" subtitle="Generate and manage coupon codes">
        <div className="flex justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Coupon Codes" subtitle="Create coupon codes and track usage">
      {/* ── Create form ── */}
      <div className="rounded-xl border border-border p-5 mb-6 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Plus className="h-4 w-4" /> Create New Coupon
        </h3>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label className="text-xs">Coupon Code *</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="SAVE100"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Diwali Offer"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Discount Type</Label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as any)}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="fixed">Fixed (₹)</option>
              <option value="percent">Percent (%)</option>
            </select>
          </div>
          <div>
            <Label className="text-xs">
              Discount Value {discountType === "fixed" ? "(₹)" : "(%)"}
            </Label>
            <Input
              type="number"
              min={1}
              value={discountValue}
              onChange={(e) => setDiscountValue(Number(e.target.value))}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Min Order Amount (₹)</Label>
            <Input
              type="number"
              min={0}
              value={minOrder}
              onChange={(e) => setMinOrder(Number(e.target.value))}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Max Uses (blank = unlimited)</Label>
            <Input
              type="number"
              min={1}
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="Unlimited"
              className="mt-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Duration</Label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={durationMode === "long"}
                onChange={() => setDurationMode("long")}
              />
              Long time / No expiry
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={durationMode === "manual"}
                onChange={() => setDurationMode("manual")}
              />
              Set manual dates
            </label>
          </div>
          {durationMode === "manual" && (
            <div className="grid gap-4 sm:grid-cols-2 mt-2">
              <div>
                <Label className="text-xs">Starts At</Label>
                <Input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Expires At</Label>
                <Input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ticket className="mr-2 h-4 w-4" />}
          Save Coupon
        </Button>
      </div>

      {/* ── Coupons table ── */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Discount</th>
              <th className="px-4 py-3 font-medium">Validity</th>
              <th className="px-4 py-3 font-medium">Used</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  No coupons yet. Create one above.
                </td>
              </tr>
            )}
            {coupons.map((c) => (
              <>
                <tr key={c.id} className="border-t border-border">
                  <td className="px-4 py-3 font-mono font-semibold">{c.code}</td>
                  <td className="px-4 py-3">{c.name}</td>
                  <td className="px-4 py-3">
                    {c.discountType === "fixed"
                      ? `₹${c.discountValue}`
                      : `${c.discountValue}%`}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {c.expiresAt
                      ? `Until ${new Date(c.expiresAt).toLocaleDateString()}`
                      : "No expiry"}
                  </td>
                  <td className="px-4 py-3">
                    {c.usedCount}
                    {c.maxUses != null ? ` / ${c.maxUses}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        c.isActive
                          ? "bg-green-500/15 text-green-600"
                          : "bg-red-500/15 text-red-600"
                      }`}
                    >
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        title="View usages"
                        onClick={() => handleViewUsages(c.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => handleToggleActive(c)}
                      >
                        {c.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      <ConfirmButton
                        trigger={
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        }
                        title="Delete this coupon?"
                        description={`Code: ${c.code}. This cannot be undone.`}
                        onConfirm={() => handleDelete(c.id)}
                      />
                    </div>
                  </td>
                </tr>
                {viewingId === c.id && (
                  <tr key={`${c.id}-usages`} className="bg-secondary/20">
                    <td colSpan={7} className="px-4 py-3">
                      <div className="text-xs font-semibold mb-2">
                        Usage history ({usages.length})
                      </div>
                      {usages.length === 0 ? (
                        <p className="text-muted-foreground text-xs">No one has used this coupon yet.</p>
                      ) : (
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-muted-foreground">
                              <th className="text-left py-1">Customer</th>
                              <th className="text-left py-1">Email</th>
                              <th className="text-left py-1">Order</th>
                              <th className="text-left py-1">Discount</th>
                              <th className="text-left py-1">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {usages.map((u) => (
                              <tr key={u.id} className="border-t border-border/50">
                                <td className="py-1">{u.customerName || "—"}</td>
                                <td className="py-1">{u.customerEmail || "—"}</td>
                                <td className="py-1 font-mono">{u.orderId || "—"}</td>
                                <td className="py-1">₹{u.discountAmount}</td>
                                <td className="py-1">
                                  {new Date(u.usedAt).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}