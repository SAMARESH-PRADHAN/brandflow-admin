import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = max - images.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${max} images allowed`);
      return;
    }
    const toRead = Array.from(files).slice(0, remaining);
    Promise.all(
      toRead.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const rd = new FileReader();
            rd.onload = () => resolve(rd.result as string);
            rd.onerror = reject;
            rd.readAsDataURL(file);
          })
      )
    ).then((results) => {
      onChange([...images, ...results]);
      if (files.length > remaining) toast(`Only added ${remaining}. Max ${max} images.`);
    });
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = (i: number) => onChange(images.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {images.map((src, i) => (
          <div
            key={i}
            className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-secondary"
          >
            <img src={src} alt={`Image ${i + 1}`} className="h-full w-full object-cover" />
            {i === 0 && (
              <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                Main
              </span>
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
            onClick={() => inputRef.current?.click()}
            className="grid aspect-square place-items-center rounded-lg border border-dashed border-border bg-secondary/40 text-muted-foreground transition hover:border-primary hover:text-primary"
          >
            <div className="flex flex-col items-center gap-1">
              <ImagePlus className="h-5 w-5" />
              <span className="text-[10px] font-medium">Add</span>
            </div>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{images.length} / {max} images{images.length > 0 ? " • First image is main" : ""}</span>
        {images.length < max && (
          <Button type="button" variant="ghost" size="sm" onClick={() => inputRef.current?.click()}>
            <ImagePlus className="mr-1 h-3.5 w-3.5" /> Upload
          </Button>
        )}
      </div>
    </div>
  );
}
