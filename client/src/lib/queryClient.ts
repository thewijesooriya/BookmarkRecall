import { QueryClient } from "@tanstack/react-query";

// Simple API client without React Query to avoid dependency issues
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }

  return res;
}

// QueryClient instance for React Query
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const [url] = queryKey as [string, Record<string, any>?];
        const params = queryKey[1] as Record<string, any> | undefined;
        
        let fullUrl = url;
        if (params && Object.keys(params).length > 0) {
          const searchParams = new URLSearchParams();
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              searchParams.append(key, String(value));
            }
          });
          if (searchParams.toString()) {
            fullUrl += `?${searchParams.toString()}`;
          }
        }
        
        const response = await apiRequest("GET", fullUrl);
        return response.json();
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});
