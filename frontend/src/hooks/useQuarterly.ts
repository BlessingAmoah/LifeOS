import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Quarter } from '../utils/quarterly';
//import { getCurrentQuarter, Quarter } from '../utils/quarterly';

export interface QuarterlyInfo {
  quarter: Quarter;
  year: number;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isLocked: boolean;
}

/**
 * Hook to get current quarter info and lock status
 */
export function useCurrentQuarter() {
  return useQuery<QuarterlyInfo>({
    queryKey: ['current-quarter'],
    queryFn: async () => {
      const response = await api.get('/stewardship/current-quarter');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to check if a quarter is read-only
 */
export function useReadOnly(quarter: Quarter, year: number) {
  return useQuery<{ isReadOnly: boolean }>({
    queryKey: ['read-only', quarter, year],
    queryFn: async () => {
      const response = await api.get(`/stewardship/read-only/${quarter}/${year}`);
      return response.data;
    },
    enabled: !!quarter && !!year,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
