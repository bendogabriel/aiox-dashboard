import { useMarketingStore } from '../../../stores/marketingStore';

export function useChartFilter<T extends Record<string, unknown>>(
  data: T[],
  dimension: string,
): T[] {
  const activeFilter = useMarketingStore((s) => s.activeFilter);
  if (!activeFilter || activeFilter.dimension !== dimension) return data;
  return data.filter((item) => String(item[dimension]) === activeFilter.value);
}
