import * as SecureStore from "expo-secure-store";
import * as Linking from "expo-linking";
import { Platform } from "react-native";

// Pinterest API v5 configuration
// Register at https://developers.pinterest.com/apps/
const PINTEREST_APP_ID = process.env.EXPO_PUBLIC_PINTEREST_APP_ID || "";
const PINTEREST_APP_SECRET = process.env.EXPO_PUBLIC_PINTEREST_APP_SECRET || "";
const REDIRECT_URI = Linking.createURL("pinterest-callback");

const API_BASE = "https://api.pinterest.com/v5";
const AUTH_BASE = "https://www.pinterest.com/oauth";

const TOKEN_KEY = "paloma-pinterest-token";
const REFRESH_KEY = "paloma-pinterest-refresh";

// Scopes we need: read user's pins and boards
const SCOPES = ["boards:read", "pins:read", "user_accounts:read"];

export interface PinterestPin {
  id: string;
  title: string | null;
  description: string | null;
  link: string | null;
  media: {
    images: {
      "600x": { url: string; width: number; height: number } | null;
      "1200x": { url: string; width: number; height: number } | null;
    };
  };
  board_id: string;
  created_at: string;
}

export interface PinterestBoard {
  id: string;
  name: string;
  description: string | null;
  pin_count: number;
  image_thumbnail_url: string | null;
  privacy: "PUBLIC" | "SECRET";
}

export interface PinterestSearchResult {
  items: PinterestPin[];
  bookmark: string | null;
}

// --- Auth Flow ---

export function getPinterestAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: PINTEREST_APP_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: SCOPES.join(","),
    state: Math.random().toString(36).slice(2),
  });
  return `${AUTH_BASE}/?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<boolean> {
  try {
    const credentials = btoa(`${PINTEREST_APP_ID}:${PINTEREST_APP_SECRET}`);
    const response = await fetch(`${API_BASE}/oauth/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }).toString(),
    });

    if (!response.ok) return false;

    const data = await response.json();
    await SecureStore.setItemAsync(TOKEN_KEY, data.access_token);
    if (data.refresh_token) {
      await SecureStore.setItemAsync(REFRESH_KEY, data.refresh_token);
    }
    return true;
  } catch {
    return false;
  }
}

export async function refreshAccessToken(): Promise<boolean> {
  try {
    const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
    if (!refreshToken) return false;

    const credentials = btoa(`${PINTEREST_APP_ID}:${PINTEREST_APP_SECRET}`);
    const response = await fetch(`${API_BASE}/oauth/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }).toString(),
    });

    if (!response.ok) return false;

    const data = await response.json();
    await SecureStore.setItemAsync(TOKEN_KEY, data.access_token);
    if (data.refresh_token) {
      await SecureStore.setItemAsync(REFRESH_KEY, data.refresh_token);
    }
    return true;
  } catch {
    return false;
  }
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function isConnected(): Promise<boolean> {
  const token = await getAccessToken();
  return !!token;
}

export async function disconnect(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

// --- API Calls ---

async function apiCall<T>(endpoint: string, params?: Record<string, string>): Promise<T | null> {
  let token = await getAccessToken();
  if (!token) return null;

  const url = new URL(`${API_BASE}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  let response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  // Token expired - try refresh
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) return null;

    token = await getAccessToken();
    if (!token) return null;

    response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  if (!response.ok) return null;
  return response.json();
}

// Get user's boards
export async function getMyBoards(): Promise<PinterestBoard[]> {
  const data = await apiCall<{ items: PinterestBoard[] }>("/boards", {
    page_size: "50",
    privacy: "PUBLIC",
  });
  return data?.items || [];
}

// Get pins from a board
export async function getBoardPins(
  boardId: string,
  bookmark?: string
): Promise<PinterestSearchResult> {
  const params: Record<string, string> = { page_size: "25" };
  if (bookmark) params.bookmark = bookmark;

  const data = await apiCall<PinterestSearchResult>(
    `/boards/${boardId}/pins`,
    params
  );
  return data || { items: [], bookmark: null };
}

// Search user's pins
export async function searchMyPins(
  query: string,
  bookmark?: string
): Promise<PinterestSearchResult> {
  const params: Record<string, string> = { query, page_size: "25" };
  if (bookmark) params.bookmark = bookmark;

  const data = await apiCall<PinterestSearchResult>(
    "/search/pins",
    params
  );
  return data || { items: [], bookmark: null };
}

// Get a single pin's details
export async function getPin(pinId: string): Promise<PinterestPin | null> {
  return apiCall<PinterestPin>(`/pins/${pinId}`);
}

// Get the best image URL from a pin
export function getPinImageUrl(pin: PinterestPin): string | null {
  return (
    pin.media?.images?.["1200x"]?.url ||
    pin.media?.images?.["600x"]?.url ||
    null
  );
}
