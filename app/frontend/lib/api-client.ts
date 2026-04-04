import createClient from "openapi-fetch";
import type { paths } from "@/types/api";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const withCredentialsFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, credentials: "include" });

const createClientInstance = () => createClient<paths>({ baseUrl, fetch: withCredentialsFetch });

export const apiClient = createClientInstance();

/**
 * API client with authentication token injection and auto-refresh on 401
 */
export const authenticatedClient = createClientInstance();

// Store for refresh callback (set by auth store)
let refreshTokenCallback: (() => Promise<void>) | null = null;
let currentToken: string | null = null;
let isRefreshing = false;

/**
 * Register callback to refresh token on 401
 */
export function setRefreshTokenCallback(callback: () => Promise<void>) {
  refreshTokenCallback = callback;
}

/**
 * Set the authentication token for all authenticated requests
 */
export function setAuthToken(token: string | null) {
  currentToken = token;
}

// Single middleware for auth header injection + 401 retry
authenticatedClient.use({
  onRequest({ request }) {
    if (currentToken) {
      request.headers.set("Authorization", `Bearer ${currentToken}`);
    }
    return request;
  },
  async onResponse({ request, response }) {
    if (response.status === 401 && refreshTokenCallback && !isRefreshing) {
      isRefreshing = true;
      try {
        await refreshTokenCallback();
        // Retry with updated token
        const retryRequest = request.clone();
        if (currentToken) {
          retryRequest.headers.set("Authorization", `Bearer ${currentToken}`);
        }
        return await fetch(retryRequest, { credentials: "include" });
      } catch (error) {
        console.error("Token refresh failed:", error);
      } finally {
        isRefreshing = false;
      }
    }
    return response;
  },
});

/**
 * Clear the authentication token
 */
export function clearAuthToken() {
  currentToken = null;
  refreshTokenCallback = null;
}
