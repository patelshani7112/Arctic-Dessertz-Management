import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActiveLocation } from "../lib/activeLocation";
import { basketsApi } from "../lib/api/inventory";
import QtyEditor from "./QtyEditor";

type ItemLite = {
  id: string;
  name: string;
  order_unit: "EACH" | "CASE";
  pack_size: number;
  default_target_qty?: number | null;
};

export default function AddToCartButton({ item, needsApproval }: { item: ItemLite; needsApproval: boolean }) {
  const qc = useQueryClient();
  const { activeLocation } = useActiveLocation();
  const locId = activeLocation?.id;

  const { data: basket } = useQuery({
    enabled: !!locId,
    queryKey: ["basket", locId],
    queryFn: () => basketsApi.getOrCreate(locId!),
  });

  const { data: lines = [] } = useQuery({
    enabled: !!basket?.id,
    queryKey: ["basket-lines", basket?.id],
    queryFn: () => basketsApi.lines(basket!.id),
  });

  const inCartEach =
    lines.filter((l: any) => l.item?.id === item.id).reduce((s: number, l: any) => s + Number(l.qty_each_requested || 0), 0) || 0;

  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"DIRECT" | "DIFF">("DIRECT");
  const [each, setEach] = React.useState(0);

  const addLineMut = useMutation({
    mutationFn: (body: any) => basketsApi.addLine(basket!.id, body),
    onSuccess: async () => {
      setOpen(false);
      setEach(0);
      setMode("DIRECT");
      await qc.invalidateQueries({ queryKey: ["basket-lines", basket?.id] });
    },
  });

  const addNow = () => {
    if (!basket) return;
    addLineMut.mutate({
      item_id: item.id,
      qty_mode: mode,
      qty_each_requested: mode === "DIRECT" ? each : Number(item.default_target_qty ?? 0),
      needs_finalize: !!needsApproval,
    });
  };

  return (
    <div className="relative inline-flex items-center gap-2">
      {inCartEach > 0 && (
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          In cart: {inCartEach}
        </span>
      )}
      <button className="btn" onClick={() => setOpen(true)}>Add</button>

      {open && (
        <div className="fixed inset-0 z-[1000]" onMouseDown={() => setOpen(false)}>
          <div
            className="absolute right-4 top-4 w-[360px] bg-white rounded-lg shadow-xl border p-3"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="font-medium mb-2">Add “{item.name}”</div>
            <QtyEditor item={item} mode={mode} setMode={setMode} each={each} setEach={setEach} />
            <div className="mt-3 flex justify-end gap-2">
              <button className="btn" onClick={() => setOpen(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                disabled={addLineMut.isPending || (mode === "DIRECT" && each <= 0)}
                onClick={addNow}
              >
                {addLineMut.isPending ? "Adding…" : "Add to cart"}
              </button>
            </div>
            {needsApproval && (
              <div className="mt-2 text-[11px] text-amber-700">
                This will require manager/global admin approval.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
