"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

interface ApiError extends Error {
  response?: {
    status: number;
  };
}

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              const apiError = error as ApiError;
              // Don't retry on 401/403 errors
              if (
                apiError?.response?.status === 401 ||
                apiError?.response?.status === 403
              ) {
                return false;
              }
              return failureCount < 3;
            },
          },
          mutations: {
            retry: false, // Don't retry mutations by default
            onError: (error) => {
              const apiError = error as ApiError;
              // Handle auth errors globally
              if (apiError?.response?.status === 401) {
                // Redirect to login or refresh token
                window.location.href = "/auth/login";
              }
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
