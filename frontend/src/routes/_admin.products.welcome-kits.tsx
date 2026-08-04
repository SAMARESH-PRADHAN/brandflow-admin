import { useState } from "react";
import { Plus, Pencil, Trash2, Gift } from "lucide-react";
import { PageShell } from "@/components/admin/page-shell";
import { SectionCard } from "@/components/admin/section-card";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCollection, inrFull, type WelcomeKitItem } from "@/lib/store";
import { ImageUploader } from "@/components/admin/image-uploader";
import { mutationError } from "@/lib/mutation-error";
import { toast } from "sonner";


function KitsPage() {
  const { data, add, update, remove, loading } = useCollection<WelcomeKitItem>("welcomeKits");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<WelcomeKitItem | null>(null);
  const [f, setF] = useState<any>({ name: "", price: 0, enabled: true, description: "", image: "", images: [] });
  const [q, setQ] = useState("");

  const filtered = data.filter((k) => k.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <PageShell title="Welcome Kit Management" subtitle="Corporate onboarding kit items"
      actions={<Button onClick={() => { setEditing(null); setF({ name: "", price: 199, enabled: true, description: "", image: "", images: [] }); setOpen(true); }}>
        <Plus className="mr-1 h-4 w-4" /> Add Item
      </Button>}>
      <SectionCard title="Kit Items" subtitle={`${filtered.length} items in the Welcome Kit category`}
        actions={<Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="w-52" />}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-4">
                <div className="skeleton mb-3 aspect-video rounded-xl" />
                <div className="skeleton mb-2 h-4 w-2/3 rounded-md" />
                <div className="skeleton h-6 w-1/3 rounded-md" />
              </div>
            ))
          ) : filtered.map((k) => (
            <div key={k.id} className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)]">
              <div className="mb-3 aspect-video overflow-hidden rounded-xl bg-secondary text-primary">
                {(k.images?.[0] || k.image) ? (
                  <img loading="lazy" src={k.images?.[0] || k.image} alt={k.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center"><Gift className="h-10 w-10" /></div>
                )}
              </div>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{k.name}</div>
                  <div className="mt-0.5 num text-xl font-display">{inrFull(k.price)}</div>
                </div>
                <Switch checked={k.enabled} onCheckedChange={async (v) => {
                  try {
                    await update(k.id, { enabled: v });
                    toast(v ? "Enabled" : "Disabled");
                  } catch (err) {
                    mutationError(err, "Failed to update item");
                  }
                }} />
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{k.description}</p>
              <div className="mt-3 flex gap-1">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => { setEditing(k); setF({ ...k, images: k.images ?? (k.image ? [k.image] : []) }); setOpen(true); }}>
                  <Pencil className="mr-1 h-3 w-3" /> Edit
                </Button>
                <ConfirmButton trigger={<Button size="sm" variant="outline" className="text-destructive"><Trash2 className="h-3 w-3" /></Button>}
                  onConfirm={async () => {
                    try {
                      await remove(k.id);
                      toast.success("Removed");
                    } catch (err) {
                      mutationError(err, "Failed to remove item");
                    }
                  }} />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Kit Item</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label className="text-xs">Name</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Price (₹)</Label><Input type="number" value={f.price} onChange={(e) => setF({ ...f, price: +e.target.value })} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Description</Label><Textarea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
            <div className="space-y-1.5">
              <Label className="text-xs">Product Image (1)</Label>
              <ImageUploader
                images={f.images ?? []}
                max={1}
                folder="welcome-kits"
                onChange={(imgs) => setF({ ...f, images: imgs, image: imgs[0] ?? "" })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label className="text-sm">Enabled</Label>
              <Switch checked={f.enabled} onCheckedChange={(v) => setF({ ...f, enabled: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              try {
                if (editing) {
                  await update(editing.id, f);
                  toast.success("Updated");
                } else {
                  await add(f);
                  toast.success("Added");
                }
                setOpen(false);
              } catch (err) {
                mutationError(err, editing ? "Failed to update item" : "Failed to add item");
              }
            }}>{editing ? "Save" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

export default KitsPage;
