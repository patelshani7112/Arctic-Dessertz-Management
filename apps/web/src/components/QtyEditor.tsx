import React from "react";
type Mode = "DIRECT" | "DIFF";

export default function QtyEditor({
  item,
  mode, setMode,
  each, setEach,
}: {
  item: { order_unit: "EACH" | "CASE"; pack_size: number; default_target_qty?: number | null };
  mode: Mode; setMode: (m: Mode) => void;
  each: number; setEach: (n: number) => void;
}) {
  const needed = mode === "DIFF" ? Math.max((item.default_target_qty ?? 0) - 0, 0) : each; // on-hand live later
  const cases = item.order_unit === "CASE" ? Math.ceil(needed / Math.max(item.pack_size || 1, 1)) : null;

  return (
    <div className="flex items-end gap-3">
      <div className="flex flex-col">
        <label className="text-xs text-gray-500">Mode</label>
        <select className="border rounded px-2 py-1" value={mode} onChange={e=>setMode(e.target.value as Mode)}>
          <option value="DIRECT">Direct</option>
          <option value="DIFF">Differential</option>
        </select>
      </div>
      {mode === "DIRECT" ? (
        <div className="flex flex-col">
          <label className="text-xs text-gray-500">Qty (each)</label>
          <input className="border rounded px-2 py-1 w-24" type="number" min={0} step="1"
                 value={each} onChange={e=>setEach(Number(e.target.value||0))}/>
        </div>
      ) : (
        <div className="text-sm text-gray-600">
          Needed (each): <b>{needed}</b>
        </div>
      )}
      {cases !== null && (
        <div className="text-xs text-gray-600">≈ {cases} case(s) @ {item.pack_size}/case</div>
      )}
    </div>
  );
}
