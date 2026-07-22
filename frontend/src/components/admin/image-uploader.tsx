import { useRef, useState } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB pre-compression
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
const MAX_DIM = 1600;
const QUALITY = 0.82;

async function optimizeImage(file: File): Promise<string> {
  // SVG / GIF: keep as-is (data URL)
  if (file.type === "image/svg+xml" || file.type === "image/gif") {
    return await new Promise<string>((resolve, reject) => {
      const rd = new FileReader();
      rd.onload = () => resolve(rd.result as string);
      rd.onerror = reject;
      rd.readAsDataURL(file);
    });
  }
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const rd = new FileReader();
    rd.onload = () => resolve(rd.result as string);
    rd.onerror = reject;
    rd.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });
  let { width, height } = img;
  if (width > MAX_DIM || height > MAX_DIM) {
    const s = Math.min(MAX_DIM / width, MAX_DIM / height);
    width = Math.round(width * s);
    height = Math.round(height * s);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, width, height);
  const outType = file.type === "image/png" ? "image/png" : "image/jpeg";
  return canvas.toDataURL(outType, QUALITY);
}

export function ImageUploader({
  images,
  onChange,
  max = 6,
}: {
  images: string[];
  onChange: (imgs: string[]) => void;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = max - images.length;
    if (remaining <= 0) { toast.error(`Maximum ${max} images allowed`); return; }
    const toRead = Array.from(files).slice(0, remaining);
    const valid: File[] = [];
    for (const f of toRead) {
      if (!ALLOWED_TYPES.includes(f.type)) {
        toast.error(`${f.name}: unsupported type (JPG/PNG/WEBP/GIF/SVG only)`);
        continue;
      }
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`${f.name}: exceeds 5MB limit`);
        continue;
      }
      valid.push(f);
    }
    if (valid.length === 0) { if (inputRef.current) inputRef.current.value = ""; return; }
    setBusy(true);
    try {
      const results = await Promise.all(valid.map(optimizeImage));
      onChange([...images, ...results]);
      if (files.length > remaining) toast(`Only added ${remaining}. Max ${max} images.`);
    } catch {
      toast.error("Failed to process images");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = (i: number) => onChange(images.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {images.map((src, i) => (
          <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-secondary">
            <img src={src} alt={`Image ${i + 1}`} className="h-full w-full object-cover" />
            {i === 0 && (
              <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">Main</span>
            )}
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-background/90 text-destructive opacity-0 shadow transition group-hover:opacity-100"
              aria-label="Remove image"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {images.length < max && (
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="grid aspect-square place-items-center rounded-lg border border-dashed border-border bg-secondary/40 text-muted-foreground transition hover:border-primary hover:text-primary disabled:opacity-50"
          >
            <div className="flex flex-col items-center gap-1">
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
              <span className="text-[10px] font-medium">{busy ? "Processing" : "Add"}</span>
            </div>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{images.length} / {max} • Auto-compressed (max 1600px, ~5MB) • JPG / PNG / WEBP / GIF / SVG</span>
      </div>
    </div>
  );
}
