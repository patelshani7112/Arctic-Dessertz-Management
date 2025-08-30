// // apps/web/src/lib/activeLocation.ts
// import * as React from "react";
// import { useQuery } from "@tanstack/react-query";
// import { My, type Location } from "./api";

// const KEY = "active_location_id"; // stores UUID or "ALL"

// function sortByFirstCreated(a?: Location[], desc = false): Location[] {
//   if (!a) return [];
//   const arr = [...a];
//   arr.sort((x, y) => {
//     const dx = new Date(x.created_at ?? 0).getTime();
//     const dy = new Date(y.created_at ?? 0).getTime();
//     return desc ? dy - dx : dx - dy;
//   });
//   return arr;
// }

// export function useActiveLocation() {
//   const { data: raw = [] } = useQuery({
//     queryKey: ["my-locations"],
//     queryFn: My.locations,
//   });

//   const myLocations = React.useMemo(
//     () => sortByFirstCreated(raw, false),
//     [raw]
//   );

//   // read stored value once
//   const initial = React.useMemo(() => {
//     const v = localStorage.getItem(KEY);
//     return v === "ALL" ? null : v; // null means "All"
//   }, []);

//   const [activeId, setActiveIdState] = React.useState<string | null>(initial);

//   // default ONLY when there is no stored selection at all
//   React.useEffect(() => {
//     const stored = localStorage.getItem(KEY);
//     if (stored === null && myLocations.length) {
//       const first = myLocations[0].id; // first created
//       setActiveIdState(first);
//       localStorage.setItem(KEY, first);
//     }
//     // if stored is "ALL", leave activeId as null
//   }, [myLocations]);

//   const setActiveId = (id: string | null) => {
//     setActiveIdState(id);
//     if (id) localStorage.setItem(KEY, id);
//     else localStorage.setItem(KEY, "ALL"); // remember "All"
//   };

//   const active = myLocations.find((l) => l.id === activeId) ?? null;

//   return { myLocations, activeId, setActiveId, active };
// }






import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { My } from "./api";

type Ctx = { activeId: string | null; setActiveId: (id: string | null) => void; myLocations: { id: string; name: string; tz: string; my_role?: string }[]; };
const ActiveLocationContext = React.createContext<Ctx | undefined>(undefined);

export function ActiveLocationProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const { data: myLocations = [] } = useQuery({ queryKey: ["my-locations"], queryFn: My.locations });
  const [activeId, setActiveIdState] = React.useState<string | null>(() => localStorage.getItem("activeLocationId"));

  React.useEffect(() => {
    if (!activeId && myLocations.length > 0) setActiveIdState(myLocations[0].id);
  }, [activeId, myLocations]);

  function setActiveId(id: string | null) {
    setActiveIdState(id);
    if (id) localStorage.setItem("activeLocationId", id); else localStorage.removeItem("activeLocationId");
    // re-run queries everywhere
    qc.invalidateQueries();
  }

  return (
    <ActiveLocationContext.Provider value={{ activeId, setActiveId, myLocations }}>
      {children}
    </ActiveLocationContext.Provider>
  );
}
export function useActiveLocation() {
  const ctx = React.useContext(ActiveLocationContext);
  if (!ctx) throw new Error("useActiveLocation must be used in provider");
  return ctx;
}
