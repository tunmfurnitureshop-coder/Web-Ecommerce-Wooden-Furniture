"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PageStatus } from "../components/page-state";

interface PageData<T> {
  status: PageStatus;
  data: T | null;
  /** Re-run the fetcher (e.g. an error-state retry button). */
  reload: () => void;
}

/**
 * Owns the loading → ready/error lifecycle for a single fetch so pages stop
 * hand-rolling useState + `.catch(console.error)` (which swallowed errors).
 *
 * The fetcher is read through a ref, so it does NOT need to be memoised by the
 * caller and the fetch runs exactly once on mount.
 *
 * @example
 * const { status, data, reload } = usePageData(() => adminListOrders());
 * return (
 *   <PageState status={status} onRetry={reload} isEmpty={!data?.items.length}
 *     errorTitle={t("loadErrorTitle")} retryLabel={tc("retry")}>
 *     <OrdersTable rows={data!.items} />
 *   </PageState>
 * );
 */
export function usePageData<T>(fetcher: () => Promise<T>): PageData<T> {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<PageStatus>("loading");
  const mounted = useRef(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const reload = useCallback(() => {
    setStatus("loading");
    fetcherRef.current()
      .then((d) => {
        if (mounted.current) {
          setData(d);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (mounted.current) setStatus("error");
      });
  }, []);

  useEffect(() => {
    mounted.current = true;
    reload();
    return () => {
      mounted.current = false;
    };
  }, [reload]);

  return { status, data, reload };
}
