import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/admin/status-badge";
import { inrFull } from "@/lib/store";

type ViewProduct = {
  id: string; code: string; name: string;
  category?: string; type?: string; subCategory?: string; material?: string;
  description?: string; overview?: string;
  specifications?: string[]; designGuidelines?: string[]; washCare?: string[];
  samplePrice?: number; originalPrice?: number;
  status?: string; image?: string; images?: string[];
  visibility?: string;
};

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
      <span className="text-xs text-muted-foreground">{k}</span>
      <span className="text-sm font-medium">{v}</span>
    </div>
  );
}
function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}

export function ProductViewDialog({ product, onClose }: { product: ViewProduct | null; onClose: () => void }) {
  return (
    <Dialog open={!!product} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {product?.name}
            {product?.status && <StatusBadge value={product.status} />}
          </DialogTitle>
        </DialogHeader>
        {product && (
          <div className="space-y-4">
            {(product.images?.length || product.image) ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {(product.images?.length ? product.images : [product.image!]).filter(Boolean).map((src, i) => (
                  <img key={i} src={src} alt="" className="aspect-square rounded-lg border border-border object-cover" />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">No images uploaded</div>
            )}
            <div className="grid gap-2 text-sm md:grid-cols-2">
              <Row k="Code" v={product.code} />
              {product.category && <Row k="Category" v={product.category} />}
              {product.type && <Row k="Type" v={product.type} />}
              {product.subCategory && <Row k="Sub Category" v={product.subCategory} />}
              {product.material && <Row k="Material" v={product.material} />}
              {product.visibility && <Row k="Available In" v={product.visibility} />}
              {product.samplePrice != null && <Row k="Sample Price" v={inrFull(product.samplePrice)} />}
              {product.originalPrice != null && <Row k="Original Price" v={inrFull(product.originalPrice)} />}
            </div>
            {product.overview && <Block title="Overview"><p className="text-sm text-muted-foreground">{product.overview}</p></Block>}
            {product.description && <Block title="Description"><p className="text-sm text-muted-foreground">{product.description}</p></Block>}
            {product.specifications?.length ? (
              <Block title="Specifications"><ol className="ml-5 list-decimal space-y-1 text-sm">{product.specifications.map((s, i) => <li key={i}>{s}</li>)}</ol></Block>
            ) : null}
            {product.designGuidelines?.length ? (
              <Block title="Design Guidelines"><ol className="ml-5 list-decimal space-y-1 text-sm">{product.designGuidelines.map((s, i) => <li key={i}>{s}</li>)}</ol></Block>
            ) : null}
            {product.washCare?.length ? (
              <Block title="Wash Care"><ol className="ml-5 list-decimal space-y-1 text-sm">{product.washCare.map((s, i) => <li key={i}>{s}</li>)}</ol></Block>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
