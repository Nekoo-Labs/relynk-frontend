import { QueryClient } from "@tanstack/react-query";

// Base API configuration
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",
  timeout: 30000,
  retries: 3,
} as const;

// HTTP Methods
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// API Response wrapper
export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
  timestamp: string;
}

// API Error types
export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: Record<string, any>;
}

// Request configuration
export interface ApiRequestConfig extends Omit<RequestInit, "method"> {
  timeout?: number;
  retries?: number;
  baseURL?: string;
  params?: Record<string, string | number | boolean>;
  skipAuth?: boolean;
}

// Custom error class for API errors
export class ApiRequestError extends Error {
  public status: number;
  public code?: string;
  public details?: Record<string, any>;

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Utility function to build URL with query parameters
function buildUrl(
  baseUrl: string,
  endpoint: string,
  params?: Record<string, string | number | boolean>
): string {
  const url = new URL(
    endpoint.startsWith("/") ? endpoint.slice(1) : endpoint,
    baseUrl
  );

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }

  return url.toString();
}

// Timeout wrapper for fetch
function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new ApiRequestError("Request timeout", 408, "TIMEOUT"));
    }, timeout);

    fetch(url, options)
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeoutId));
  });
}

// Get authentication token (implement based on your auth strategy)
async function getAuthToken(): Promise<string | null> {
  // This should be implemented based on your authentication strategy
  // For example, if using NextAuth:
  // const session = await getSession();
  // return session?.accessToken || null;

  // For now, return null - implement based on your auth setup
  if (typeof window !== "undefined") {
    return localStorage.getItem("authToken");
  }
  return null;
}

// Main API fetch function
export async function apiFetch<T = any>(
  endpoint: string,
  options: ApiRequestConfig & { method?: HttpMethod } = {}
): Promise<ApiResponse<T>> {
  const {
    method = "GET",
    timeout = API_CONFIG.timeout,
    retries = API_CONFIG.retries,
    baseURL = API_CONFIG.baseURL,
    params,
    skipAuth = false,
    headers: customHeaders = {},
    ...fetchOptions
  } = options;

  const url = buildUrl(baseURL, endpoint, params);

  // Prepare headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(customHeaders as Record<string, string>),
  };

  // Add authentication if not skipped
  if (!skipAuth) {
    const token = await getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  // Prepare fetch options
  const fetchConfig: RequestInit = {
    method,
    headers,
    ...fetchOptions,
  };

  // Add body for non-GET requests
  if (method !== "GET" && fetchOptions.body) {
    if (
      typeof fetchOptions.body === "object" &&
      !(fetchOptions.body instanceof FormData)
    ) {
      fetchConfig.body = JSON.stringify(fetchOptions.body);
    }
  }

  // Retry logic
  let lastError: ApiRequestError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, fetchConfig, timeout);

      // Handle non-JSON responses
      const contentType = response.headers.get("content-type");
      const isJson = contentType?.includes("application/json");

      if (!response.ok) {
        let errorData: any = {};

        if (isJson) {
          try {
            errorData = await response.json();
          } catch {
            // Ignore JSON parse errors for error responses
          }
        }

        throw new ApiRequestError(
          errorData.message ||
            errorData.error ||
            `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.code,
          errorData.details
        );
      }

      // Parse successful response
      if (isJson) {
        const data = await response.json();

        // If the response is already in ApiResponse format, return it
        if (data && typeof data === "object" && "success" in data) {
          return data as ApiResponse<T>;
        }

        // Otherwise, wrap it in ApiResponse format
        return {
          data: data as T,
          success: true,
          timestamp: new Date().toISOString(),
        };
      } else {
        // Handle non-JSON responses (like text, blob, etc.)
        const text = await response.text();
        return {
          data: text as unknown as T,
          success: true,
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      lastError =
        error instanceof ApiRequestError
          ? error
          : new ApiRequestError(
              error instanceof Error ? error.message : "Unknown error occurred",
              0,
              "UNKNOWN_ERROR"
            );

      // Don't retry on client errors (4xx) except 408 (timeout)
      if (
        lastError.status >= 400 &&
        lastError.status < 500 &&
        lastError.status !== 408
      ) {
        break;
      }

      // Don't retry on the last attempt
      if (attempt === retries) {
        break;
      }

      // Wait before retrying (exponential backoff)
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }

  throw lastError!;
}

// Convenience methods for different HTTP verbs
export const api = {
  get: <T = any>(endpoint: string, config?: Omit<ApiRequestConfig, "method">) =>
    apiFetch<T>(endpoint, { ...config, method: "GET" }),

  post: <T = any>(
    endpoint: string,
    data?: any,
    config?: Omit<ApiRequestConfig, "method">
  ) => apiFetch<T>(endpoint, { ...config, method: "POST", body: data }),

  put: <T = any>(
    endpoint: string,
    data?: any,
    config?: Omit<ApiRequestConfig, "method">
  ) => apiFetch<T>(endpoint, { ...config, method: "PUT", body: data }),

  patch: <T = any>(
    endpoint: string,
    data?: any,
    config?: Omit<ApiRequestConfig, "method">
  ) => apiFetch<T>(endpoint, { ...config, method: "PATCH", body: data }),

  delete: <T = any>(
    endpoint: string,
    config?: Omit<ApiRequestConfig, "method">
  ) => apiFetch<T>(endpoint, { ...config, method: "DELETE" }),
};

// React Query configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors except timeout
        if (error instanceof ApiRequestError) {
          if (
            error.status >= 400 &&
            error.status < 500 &&
            error.status !== 408
          ) {
            return false;
          }
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry mutations on client errors
        if (
          error instanceof ApiRequestError &&
          error.status >= 400 &&
          error.status < 500
        ) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

// Query key factory for consistent cache keys
export const queryKeys = {
  all: ["api"] as const,
  lists: () => [...queryKeys.all, "list"] as const,
  list: (filters: Record<string, any>) =>
    [...queryKeys.lists(), filters] as const,
  details: () => [...queryKeys.all, "detail"] as const,
  detail: (id: string | number) => [...queryKeys.details(), id] as const,

  // Profile-specific keys
  profiles: {
    all: () => [...queryKeys.all, "profiles"] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.profiles.all(), "list", filters] as const,
    detail: (address: string) =>
      [...queryKeys.profiles.all(), "detail", address] as const,
    data: (address: string) =>
      [...queryKeys.profiles.detail(address), "data"] as const,
    earnings: (address: string) =>
      [...queryKeys.profiles.detail(address), "earnings"] as const,
  },

  // Add more domain-specific query keys as needed
} as const;

// Type-safe query key generator
export type QueryKey = readonly unknown[];

// Utility function to invalidate related queries
export function invalidateQueries(pattern: readonly unknown[]) {
  return queryClient.invalidateQueries({ queryKey: pattern });
}
