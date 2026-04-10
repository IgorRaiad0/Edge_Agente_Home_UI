import { useCallback, useEffect, useMemo, useState } from 'react';
import { Automation, fetchAutomations } from '../services/api';

export interface UseAutomationsReturn {
  automations: Automation[];
  isLoading: boolean;
  search: string;
  setSearch: (s: string) => void;
  filteredAutomations: Automation[];
  refresh: () => void;
}

/**
 * Custom hook that manages automation data with loading simulation,
 * search filtering and refresh capability.
 */
export function useAutomations(): UseAutomationsReturn {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchAutomations();
      setAutomations(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredAutomations = useMemo(() => {
    if (!search.trim()) return automations;
    const q = search.toLowerCase();
    return automations.filter((a) => a.label.toLowerCase().includes(q));
  }, [automations, search]);

  return {
    automations,
    isLoading,
    search,
    setSearch,
    filteredAutomations,
    refresh: load,
  };
}
