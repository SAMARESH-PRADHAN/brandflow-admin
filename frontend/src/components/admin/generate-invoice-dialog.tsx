import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Order } from "@/lib/store";
import { downloadTaxInvoice } from "@/lib/taxInvoice";
import { toast } from "sonner";

type Props = {
  order: Order | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (orderId: string, invoiceNumber: string, date: string) => Promise<void>;
};

export function GenerateInvoiceDialog({
  order,
  open,
  onOpenChange,
  onSave,
}: Props) {
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [saving, setSaving] = useState(false);
const [invoiceDate, setInvoiceDate] = useState("");

  useEffect(() => {
    if (order && open) {
      setInvoiceNumber(order.invoiceNumber || "");
      setInvoiceDate(order.date || "");
    }
  }, [order, open]);

  if (!order) return null;

  const handleSaveAndDownload = async () => {
  const no = invoiceNumber.trim();
  if (!no) {
    toast.error("Please enter invoice number");
    return;
  }

  const originalDate = order.date || "";
  const newDate = invoiceDate.trim();

  // If date was changed → ask for confirmation
  if (newDate && newDate !== originalDate) {
    const confirmed = window.confirm(
      `You are changing the order date from "${originalDate}" to "${newDate}".\n\nThis will permanently update the order date. Continue?`
    );
    if (!confirmed) return;
  }

  setSaving(true);
  try {
    // Save invoice number + (possibly new) date
    await onSave(order.id, no, newDate || originalDate);

    // Use the updated date in the PDF
    const orderForPdf = { ...order, date: newDate || originalDate, invoiceNumber: no };
    await downloadTaxInvoice(orderForPdf, { invoiceNumber: no });

    toast.success("Invoice saved & downloaded");
    onOpenChange(false);
  } catch (err: any) {
    const msg =
      err?.message ||
      err?.error ||
      "Failed to save invoice (number may already be used)";
    toast.error(msg);
  } finally {
    setSaving(false);
  }
};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Invoice — {order.id}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Invoice Number *</Label>
            <Input
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="e.g. 450 or INV-001"
            />
            <p className="text-[11px] text-muted-foreground">
              Must be unique. Cannot be used on another order.
            </p>
          </div>

          <div className="space-y-1.5">
  <Label>Invoice / Order Date</Label>
  <Input
    type="date"
    value={invoiceDate}
    onChange={(e) => setInvoiceDate(e.target.value)}
  />
  <p className="text-[11px] text-muted-foreground">
    Changing this will also update the order date after confirmation.
  </p>
</div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveAndDownload} disabled={saving}>
            {saving ? "Saving…" : "Save & Download Invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}