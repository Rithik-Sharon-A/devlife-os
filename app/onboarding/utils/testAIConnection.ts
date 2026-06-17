import type { AIProvider, AIMessage } from "../../../types";
import { buildRequest, getProvider, parseResponse } from "../../../data/providers";

const TEST_TIMEOUT_MS = 30_000;

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = TEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function testAIConnection(
  providerId: AIProvider,
  apiKey: string,
  model: string
): Promise<{ success: boolean; error?: string }> {
  const provider = getProvider(providerId);
  const key = provider.requiresKey ? apiKey.trim() : apiKey;

  if (provider.requiresKey && !key) {
    return { success: false, error: "API key is required." };
  }

  const messages: AIMessage[] = [
    { role: "user", content: "Reply with exactly: OK", timestamp: new Date().toISOString() },
  ];

  try {
    const { url, headers, body } = buildRequest(
      provider,
      key,
      messages,
      model,
      "You are a connection test assistant."
    );

    const response = await fetchWithTimeout(url, {
      method: "POST",
      headers,
      body,
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        success: false,
        error: text.slice(0, 200) || `HTTP ${response.status}`,
      };
    }

    const json = await response.json();
    const reply = parseResponse(provider, json);
    return { success: reply.toUpperCase().includes("OK") };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.name === "AbortError"
          ? "Connection timed out."
          : error.message
        : "Connection failed.";
    return { success: false, error: message };
  }
}
