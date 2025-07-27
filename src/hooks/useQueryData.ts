import {
  UseQueryOptions,
  QueryKey,
  useQuery,
} from "@tanstack/react-query";

/**
 * useQueryData Hook
 * Purpose: A wrapper around TanStack Query's useQuery hook to standardize query handling
 * 
 * @param queryKey - Unique identifier for the query (used for caching)
 * @param queryFn - Function that performs the actual data fetching
 * @param options - Optional useQuery options
 * 
 * Returns: Commonly used query states and the refetch function
 */
export const useQueryData = <
  TData = unknown,
  TError = Error
>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError, TData>, 'queryKey' | 'queryFn'>
) => {
  const { 
    data,       // The query result data
    isPending,  // True if the query is in a pending state (loading first time)
    isFetched,  // True if the query has been fetched at least once
    isFetching, // True if the query is currently fetching (including background updates)
    refetch     // Function to manually trigger a refetch
  } = useQuery({
    queryKey,
    queryFn,
    ...options
  });

  return { 
    data,       // The fetched data
    isPending,  // Loading state for first fetch
    isFetched,  // Whether data has been fetched
    isFetching, // Current loading state
    refetch     // Manual refetch trigger
  };
};
