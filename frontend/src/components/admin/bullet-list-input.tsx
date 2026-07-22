import { useState } from "react";
import { Plus, X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function BulletListInput({
  items,
  onChange,
  placeholder = "Add a point…",
}: {
  items: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const t = draft.trim();
    if (!t) return;
    onChange([...items, t]);
    setDraft("");
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const c = [...items];
    [c[i], c[j]] = [c[j]!, c[i]!];
    onChange(c);
  };
  const edit = (i: number, v: string) => {
    const c = [...items];
    c[i] = v;
    onChange(c);
  };

  return (
    <div className="space-y-2">
      {items.length > 0 && (
        <div className="space-y-1.5 rounded-lg border border-border bg-secondary/30 p-2">
          {items.map((val, i) => (
            <div key={i} className="group flex items-center gap-2">
              <div className="flex flex-col">
                <button type="button" onClick={() => move(i, -1)} className="text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={i === 0}>
                  <GripVertical className="h-3 w-3 rotate-90" />
                </button>
              </div>
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                {i + 1}
              </span>
              <Input
                value={val}
                onChange={(e) => edit(i, e.target.value)}
                className="h-8 flex-1 bg-card text-sm"
              />
              <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(i)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="h-9 flex-1"
        />
        <Button type="button" onClick={add} size="sm" variant="outline">
          <Plus className="mr-1 h-3.5 w-3.5" /> Add
        </Button>
      </div>
    </div>
  );
}
