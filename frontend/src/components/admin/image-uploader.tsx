import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { deleteUploadedImage, uploadImage } from "@/lib/api";

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB pre-compression
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
const MAX_DIM = 1600;
const QUALITY = 0.82;

async function optimizeImage(file: File): Promise<string> {
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
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, width, height);
  const outType = file.type === "image/png" ? "image/png" : "image/jpeg";
  return canvas.toDataURL(outType, QUALITY);
}

function isDeletableUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

type UploadingItem = { key: string; preview: string };


export function ImageUploader({
  images,
  onChange,
  max = 4,
  folder = "uploads",
  onUploadingChange,
}: {
  images: string[];
  onChange: (imgs: string[]) => void;
  max?: number;
  folder?: string;
   onUploadingChange?: (uploading: boolean) => void; // NEW
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadingItems, setUploadingItems] = useState<UploadingItem[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = max - images.length - uploadingItems.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${max} images allowed`);
      return;
    }
    const toRead = Array.from(files).slice(0, remaining);
    const valid: File[] = [];
    for (const f of toRead) {
      if (!ALLOWED_TYPES.includes(f.type)) {
        toast.error(`${f.name}: unsupported type (JPG/PNG/WEBP/GIF/SVG only)`);
        continue;
      }
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`${f.name}: please upload an image under 1 MB`);
        continue;
      }
      valid.push(f);
    }
    if (valid.length === 0) {
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    const batchId = Date.now();
    const pending: UploadingItem[] = valid.map((f, i) => ({
      key: `${batchId}-${i}`,
      preview: URL.createObjectURL(f),
    }));
    setUploadingItems((prev) => [...prev, ...pending]);

    const uploaded = await Promise.all(
      valid.map(async (file, idx) => {
        const item = pending[idx]!;
        try {
          const dataUrl = await optimizeImage(file);
          const { url } = await uploadImage(dataUrl, folder, {
            index: images.length + idx,
          });
          return url;
        } catch (err) {
          console.error("[ImageUploader] upload failed:", file.name, err);
          toast.error(`${file.name}: upload failed`);
          return null;
        } finally {
          URL.revokeObjectURL(item.preview);
          setUploadingItems((prev) => prev.filter((u) => u.key !== item.key));
        }
      }),
    );

    const succeeded = uploaded.filter((url): url is string => url !== null);
    if (succeeded.length > 0) {
      onChange([...images, ...succeeded]);
    }
    if (files.length > remaining) {
      toast(`Only added ${remaining}. Max ${max} images.`);
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = (i: number) => {
    const url = images[i];
    onChange(images.filter((_, idx) => idx !== i));
    if (url && isDeletableUrl(url)) {
      deleteUploadedImage(url).catch((err) => {
        console.error("[ImageUploader] delete failed:", url, err);
      });
    }
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[i], next[j]] = [next[j]!, next[i]!];
    onChange(next);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    void handleFiles(e.dataTransfer.files);
  };
useEffect(() => {
  onUploadingChange?.(uploadingItems.length > 0);
}, [uploadingItems, onUploadingChange]);

  const atCapacity = images.length + uploadingItems.length >= max;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {images.map((src, i) => (
          <div
            key={`${src}-${i}`}
            className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-secondary"
          >
            <img src={src} alt={`Image ${i + 1}`} className="h-full w-full object-cover" />
            {i === 0 && (
              <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                Main
              </span>
            )}
            <div className="absolute bottom-1 left-1 flex gap-0.5 opacity-0 transition group-hover:opacity-100">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="grid h-6 w-6 place-items-center rounded-full bg-background/90 shadow disabled:opacity-30"
                aria-label="Move left"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === images.length - 1}
                className="grid h-6 w-6 place-items-center rounded-full bg-background/90 shadow disabled:opacity-30"
                aria-label="Move right"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
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
        {uploadingItems.map((item) => (
          <div
            key={item.key}
            className="relative aspect-square overflow-hidden rounded-lg border border-border bg-secondary"
          >
            <img src={item.preview} alt="" className="h-full w-full object-cover opacity-50" />
            <div className="absolute inset-0 grid place-items-center bg-background/40">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          </div>
        ))}
        {!atCapacity && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`grid aspect-square place-items-center rounded-lg border border-dashed bg-secondary/40 text-muted-foreground transition hover:border-primary hover:text-primary disabled:opacity-50 ${
              dragOver ? "border-primary bg-primary/5 text-primary" : "border-border"
            }`}
          >
            <div className="flex flex-col items-center gap-1">
              <ImagePlus className="h-5 w-5" />
              <span className="text-[10px] font-medium">{dragOver ? "Drop here" : "Add"}</span>
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
        onChange={(e) => void handleFiles(e.target.files)}
      />
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          {images.length} / {max} • Recommended: square images, 1000×1000px or larger. Max 1MB — automatically optimized after upload.
        </span>
      </div>
    </div>
  );
}
