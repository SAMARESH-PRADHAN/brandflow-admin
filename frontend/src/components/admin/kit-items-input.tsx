import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type KitItem = { name: string; price: number };

export function KitItemsInput({
  items,
  onChange,
}: {
  items: KitItem[];
  onChange: (v: KitItem[]) => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number>(0);

  const add = () => {
    if (!name.trim()) return;
    onChange([...items, { name: name.trim(), price }]);
    setName("");
    setPrice(0);
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const edit = (i: number, patch: Partial<KitItem>) => {
    const c = [...items];
    c[i] = { ...c[i]!, ...patch };
    onChange(c);
  };

  return (
    <div className="space-y-2">
      {items.length > 0 && (
        <div className="space-y-1.5 rounded-lg border border-border bg-secondary/30 p-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={item.name}
                onChange={(e) => edit(i, { name: e.target.value })}
                className="h-8 flex-1 bg-card text-sm"
                placeholder="Item name"
              />
              <Input
                type="number"
                value={item.price}
                onChange={(e) => edit(i, { price: +e.target.value })}
                className="h-8 w-24 bg-card text-sm"
                placeholder="Price"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive"
                onClick={() => remove(i)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Item name (e.g. T-shirt)"
          className="h-9 flex-1"
        />
        <Input
          type="number"
          value={price}
          onChange={(e) => setPrice(+e.target.value)}
          placeholder="Price"
          className="h-9 w-28"
        />
        <Button type="button" onClick={add} size="sm" variant="outline">
          <Plus className="mr-1 h-3.5 w-3.5" /> Add
        </Button>
      </div>
    </div>
  );
}