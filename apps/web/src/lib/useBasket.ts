// apps/web/src/lib/useBasket.ts
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { basketsApi } from "./api/inventory";

export function useBasket(location_id?: string | null) {
  const qc = useQueryClient();

  const { data: basket } = useQuery({
    enabled: !!location_id,
    queryKey: ["basket", location_id],
    queryFn: async () => basketsApi.getOrCreate(location_id!),
    staleTime: 10_000,
  });

  const basket_id = basket?.id as string | undefined;

  const { data: lines = [] } = useQuery({
    enabled: !!basket_id,
    queryKey: ["basket-lines", basket_id],
    queryFn: () => basketsApi.lines(basket_id!),
  });

  const addMut = useMutation({
    mutationFn: (body: Parameters<typeof basketsApi.addLine>[1]) =>
      basketsApi.addLine(basket_id!, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["basket-lines", basket_id] }),
  });

  const updMut = useMutation({
    mutationFn: (args: { id: string; patch: any }) =>
      basketsApi.updateLine(args.id, args.patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["basket-lines", basket_id] }),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => basketsApi.deleteLine(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["basket-lines", basket_id] }),
  });

  const finMut = useMutation({
    mutationFn: (id: string) => basketsApi.finalizeLine(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["basket-lines", basket_id] }),
  });

  return { basket, basket_id, lines, addMut, updMut, delMut, finMut };
}
