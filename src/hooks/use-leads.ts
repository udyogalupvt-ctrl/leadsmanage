import { useEffect, useState } from "react";
import { subscribeLead, subscribeLeads } from "@/lib/leads";
import type { Lead } from "@/lib/types";

export function useLeads(userId: string | undefined) {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!userId) {
      setLeads([]);
      return;
    }
    let mounted = true;
    let unsub: (() => void) | null = null;
    try {
      unsub = subscribeLeads(userId, (items) => {
        if (mounted) setLeads(items);
      });
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
    return () => {
      mounted = false;
      unsub?.();
    };
  }, [userId]);
  return { leads, loading: leads === null && !error, error };
}

export function useLead(id: string, userId: string | undefined) {
  const [lead, setLead] = useState<Lead | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!userId) {
      setLead(null);
      return;
    }
    let mounted = true;
    let unsub: (() => void) | null = null;
    try {
      unsub = subscribeLead(id, userId, (l) => {
        if (mounted) setLead(l);
      });
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
    return () => {
      mounted = false;
      unsub?.();
    };
  }, [id, userId]);
  return { lead, loading: lead === undefined && !error, error };
}
