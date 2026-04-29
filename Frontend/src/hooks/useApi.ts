import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/backendApi';

// Generic API hook for GET requests
export function useApi<T>(
  url: string,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    refetchOnWindowFocus?: boolean;
  }
) {
  return useQuery({
    queryKey: [url],
    queryFn: async () => {
      const result = await api<T>(url);
      if (result.status !== 200 || !result.data) {
        throw new Error(`API Error: ${result.status}`);
      }
      return result.data;
    },
    enabled: options?.enabled ?? true,
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes default
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
  });
}

// Generic API hook for POST/PUT/DELETE requests
export function useApiMutation<T, V = any>(
  url: string,
  method: 'POST' | 'PUT' | 'DELETE' = 'POST',
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  }
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (variables: V) => {
      const result = await api<T>(url, {
        method,
        body: JSON.stringify(variables),
      });
      if (result.status !== 200 && result.status !== 201 || !result.data) {
        throw new Error(`API Error: ${result.status}`);
      }
      return result.data;
    },
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries();
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}

// Specific hooks for common endpoints
export function useProfile() {
  return useApi('/api/auth/profile', {
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useAssignments(batch?: string) {
  const url = batch ? `/api/assignments?batch=${batch}` : '/api/assignments';
  return useApi(url);
}

export function useNotifications() {
  return useApi('/api/notifications', {
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
  });
}
