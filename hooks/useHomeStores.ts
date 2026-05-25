import { useCallback, useEffect, useState } from "react";
import { fetchUserStores, UserStore } from "../lib/stores";

export interface HomeStores {
  zabka: UserStore | null;
  biedronka: UserStore | null;
}

export function useHomeStores() {
  const [stores, setStores] = useState<HomeStores | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchUserStores();
      setStores({
        zabka: list.find((s) => s.shop === "zabka") ?? null,
        biedronka: list.find((s) => s.shop === "biedronka") ?? null,
      });
    } catch {
      setStores({ zabka: null, biedronka: null });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const hasAll =
    stores !== null && stores.zabka !== null && stores.biedronka !== null;

  return { stores, loading, hasAll, refresh };
}
