import { QueryClient } from "@tanstack/react-query";

// In production, __PORT_5000__ is replaced by the deploy proxy path.
// In local dev (no replacement), API calls go to the same origin.
const RAW_BASE = "__PORT_5000__";
const API_BASE = RAW_BASE.startsWith("__") ? "" : RAW_BASE;

export async function apiRequest(method: string, path: string, body?: any): Promise<Response> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method,
    headers: body instanceof FormData ? undefined : { "Content-Type": "application/json" },
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });
  return res;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const [path] = queryKey as string[];
        const res = await apiRequest("GET", path);
        if (!res.ok) {
          if (res.status === 401) throw new Error("Unauthorized");
          throw new Error(`Request failed: ${res.status}`);
        }
        return res.json();
      },
      retry: false,
      staleTime: 1000 * 60,
    },
  },
});
