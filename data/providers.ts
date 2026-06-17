import type { AIProvider, AIMessage } from "../types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProviderModel {
  id: string;
  displayName: string;
  contextWindow: number;
  isFree: boolean;
}

export interface BuiltRequest {
  url: string;
  headers: Record<string, string>;
  body: string;
}

export interface ProviderConfig {
  id: AIProvider;
  displayName: string;
  baseURL: string;
  models: ProviderModel[];
  isOpenAICompatible: boolean;
  requiresKey: boolean;
  freeModelsAvailable: boolean;
  setupInstructions: string;
  headerBuilder: (apiKey: string) => Record<string, string>;
  requestBuilder: (
    messages: AIMessage[],
    model: string,
    systemPrompt?: string
  ) => Record<string, unknown>;
  responseParser: (rawResponse: unknown) => string;
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function openAIMessages(
  messages: AIMessage[],
  systemPrompt?: string
): Array<{ role: string; content: string }> {
  const out: Array<{ role: string; content: string }> = [];
  if (systemPrompt) out.push({ role: "system", content: systemPrompt });
  for (const m of messages) out.push({ role: m.role, content: m.content });
  return out;
}

function parseOpenAIResponse(raw: unknown): string {
  const r = raw as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = r?.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("Unexpected OpenAI response shape");
  return content;
}

// ─── Provider Definitions ─────────────────────────────────────────────────────

const openRouterConfig: ProviderConfig = {
  id: "openrouter",
  displayName: "OpenRouter",
  baseURL: "https://openrouter.ai/api/v1",
  isOpenAICompatible: true,
  requiresKey: true,
  freeModelsAvailable: true,
  setupInstructions:
    "Sign up at https://openrouter.ai → Dashboard → Keys → Create Key. Free models are available without billing.",
  models: [
    {
      id: "meta-llama/llama-3.1-8b-instruct:free",
      displayName: "Llama 3.1 8B (Free)",
      contextWindow: 131072,
      isFree: true,
    },
    {
      id: "google/gemma-2-9b-it:free",
      displayName: "Gemma 2 9B (Free)",
      contextWindow: 8192,
      isFree: true,
    },
    {
      id: "mistralai/mistral-7b-instruct:free",
      displayName: "Mistral 7B (Free)",
      contextWindow: 32768,
      isFree: true,
    },
    {
      id: "anthropic/claude-3.5-haiku",
      displayName: "Claude 3.5 Haiku",
      contextWindow: 200000,
      isFree: false,
    },
    {
      id: "openai/gpt-4o-mini",
      displayName: "GPT-4o Mini",
      contextWindow: 128000,
      isFree: false,
    },
  ],
  headerBuilder: (apiKey) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "HTTP-Referer": "https://dayos.app",
    "X-Title": "DayOS",
  }),
  requestBuilder: (messages, model, systemPrompt) => ({
    model,
    messages: openAIMessages(messages, systemPrompt),
    temperature: 0.7,
    max_tokens: 1024,
  }),
  responseParser: parseOpenAIResponse,
};

const groqConfig: ProviderConfig = {
  id: "groq",
  displayName: "Groq",
  baseURL: "https://api.groq.com/openai/v1",
  isOpenAICompatible: true,
  requiresKey: true,
  freeModelsAvailable: true,
  setupInstructions:
    "Sign up at https://console.groq.com → API Keys → Create API Key. Generous free tier with rate limits.",
  models: [
    {
      id: "llama-3.1-8b-instant",
      displayName: "Llama 3.1 8B Instant",
      contextWindow: 131072,
      isFree: true,
    },
    {
      id: "llama-3.3-70b-versatile",
      displayName: "Llama 3.3 70B Versatile",
      contextWindow: 131072,
      isFree: true,
    },
    {
      id: "mixtral-8x7b-32768",
      displayName: "Mixtral 8x7B",
      contextWindow: 32768,
      isFree: true,
    },
    {
      id: "gemma2-9b-it",
      displayName: "Gemma2 9B",
      contextWindow: 8192,
      isFree: true,
    },
  ],
  headerBuilder: (apiKey) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  }),
  requestBuilder: (messages, model, systemPrompt) => ({
    model,
    messages: openAIMessages(messages, systemPrompt),
    temperature: 0.7,
    max_tokens: 1024,
  }),
  responseParser: parseOpenAIResponse,
};

const openAIConfig: ProviderConfig = {
  id: "openai",
  displayName: "OpenAI",
  baseURL: "https://api.openai.com/v1",
  isOpenAICompatible: true,
  requiresKey: true,
  freeModelsAvailable: false,
  setupInstructions:
    "Sign up at https://platform.openai.com → API Keys → Create new secret key. Requires billing.",
  models: [
    {
      id: "gpt-4o-mini",
      displayName: "GPT-4o Mini",
      contextWindow: 128000,
      isFree: false,
    },
    {
      id: "gpt-4o",
      displayName: "GPT-4o",
      contextWindow: 128000,
      isFree: false,
    },
    {
      id: "gpt-3.5-turbo",
      displayName: "GPT-3.5 Turbo",
      contextWindow: 16385,
      isFree: false,
    },
  ],
  headerBuilder: (apiKey) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  }),
  requestBuilder: (messages, model, systemPrompt) => ({
    model,
    messages: openAIMessages(messages, systemPrompt),
    temperature: 0.7,
    max_tokens: 1024,
  }),
  responseParser: parseOpenAIResponse,
};

const anthropicConfig: ProviderConfig = {
  id: "anthropic",
  displayName: "Anthropic",
  baseURL: "https://api.anthropic.com/v1",
  isOpenAICompatible: false,
  requiresKey: true,
  freeModelsAvailable: false,
  setupInstructions:
    "Sign up at https://console.anthropic.com → API Keys → Create Key. Requires billing.",
  models: [
    {
      id: "claude-haiku-4-5-20251001",
      displayName: "Claude Haiku 4.5",
      contextWindow: 200000,
      isFree: false,
    },
    {
      id: "claude-sonnet-4-6",
      displayName: "Claude Sonnet 4.6",
      contextWindow: 200000,
      isFree: false,
    },
  ],
  headerBuilder: (apiKey) => ({
    "Content-Type": "application/json",
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
  }),
  // Anthropic uses a separate top-level `system` field, not a system message
  requestBuilder: (messages, model, systemPrompt) => {
    const userMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role, content: m.content }));
    const body: Record<string, unknown> = {
      model,
      max_tokens: 1024,
      messages: userMessages,
    };
    if (systemPrompt) body.system = systemPrompt;
    return body;
  },
  responseParser: (raw) => {
    const r = raw as {
      content?: Array<{ type?: string; text?: string }>;
    };
    const block = r?.content?.find((b) => b.type === "text");
    if (typeof block?.text !== "string")
      throw new Error("Unexpected Anthropic response shape");
    return block.text;
  },
};

const geminiConfig: ProviderConfig = {
  id: "gemini",
  displayName: "Google Gemini",
  baseURL: "https://generativelanguage.googleapis.com/v1beta",
  isOpenAICompatible: false,
  requiresKey: true,
  freeModelsAvailable: true,
  setupInstructions:
    "Visit https://aistudio.google.com/app/apikey → Create API Key. Free tier available.",
  models: [
    {
      id: "gemini-1.5-flash",
      displayName: "Gemini 1.5 Flash",
      contextWindow: 1000000,
      isFree: true,
    },
    {
      id: "gemini-1.5-pro",
      displayName: "Gemini 1.5 Pro",
      contextWindow: 2000000,
      isFree: false,
    },
    {
      id: "gemini-2.0-flash",
      displayName: "Gemini 2.0 Flash",
      contextWindow: 1000000,
      isFree: true,
    },
  ],
  // API key goes in query param, not header — headerBuilder still sets Content-Type
  headerBuilder: (_apiKey) => ({
    "Content-Type": "application/json",
  }),
  // Gemini uses a completely different shape: { contents: [{ role, parts: [{text}] }] }
  requestBuilder: (messages, _model, systemPrompt) => {
    const contents = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    };

    if (systemPrompt) {
      body.systemInstruction = { parts: [{ text: systemPrompt }] };
    }

    return body;
  },
  responseParser: (raw) => {
    const r = raw as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };
    const text = r?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string")
      throw new Error("Unexpected Gemini response shape");
    return text;
  },
};

const ollamaConfig: ProviderConfig = {
  id: "ollama",
  displayName: "Ollama (Local)",
  baseURL: "http://localhost:11434/api",
  isOpenAICompatible: false,
  requiresKey: false,
  freeModelsAvailable: true,
  setupInstructions:
    "Install Ollama from https://ollama.ai → run `ollama pull llama3` in your terminal. No API key needed.",
  models: [
    {
      id: "llama3",
      displayName: "Llama 3 (8B)",
      contextWindow: 8192,
      isFree: true,
    },
    {
      id: "mistral",
      displayName: "Mistral 7B",
      contextWindow: 32768,
      isFree: true,
    },
    {
      id: "phi3",
      displayName: "Phi-3 Mini",
      contextWindow: 4096,
      isFree: true,
    },
    {
      id: "gemma2",
      displayName: "Gemma 2 (9B)",
      contextWindow: 8192,
      isFree: true,
    },
  ],
  headerBuilder: (_apiKey) => ({
    "Content-Type": "application/json",
  }),
  // Ollama /api/chat uses OpenAI-like shape but with `stream: false`
  requestBuilder: (messages, model, systemPrompt) => ({
    model,
    stream: false,
    messages: openAIMessages(messages, systemPrompt),
    options: { temperature: 0.7, num_predict: 1024 },
  }),
  responseParser: (raw) => {
    const r = raw as { message?: { content?: string } };
    const content = r?.message?.content;
    if (typeof content !== "string")
      throw new Error("Unexpected Ollama response shape");
    return content;
  },
};

// ─── Registry ─────────────────────────────────────────────────────────────────

export const PROVIDERS: Record<AIProvider, ProviderConfig> = {
  openrouter: openRouterConfig,
  groq: groqConfig,
  openai: openAIConfig,
  anthropic: anthropicConfig,
  gemini: geminiConfig,
  ollama: ollamaConfig,
};

// ─── Unified API ──────────────────────────────────────────────────────────────

export function getProvider(id: AIProvider): ProviderConfig {
  return PROVIDERS[id];
}

/**
 * Builds the full fetch-ready request for any provider.
 * For Gemini the API key is appended as a query param.
 * For all others it goes in headers via headerBuilder.
 */
export function buildRequest(
  provider: ProviderConfig,
  apiKey: string,
  messages: AIMessage[],
  model: string,
  systemPrompt?: string
): BuiltRequest {
  const headers = provider.headerBuilder(apiKey);
  const bodyObj = provider.requestBuilder(messages, model, systemPrompt);

  let url: string;

  if (provider.id === "gemini") {
    // Gemini endpoint: /models/{model}:generateContent?key=...
    url = `${provider.baseURL}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  } else if (provider.id === "ollama") {
    url = `${provider.baseURL}/chat`;
  } else {
    // OpenAI-compatible and Anthropic both use /chat/completions or /messages
    const path = provider.id === "anthropic" ? "/messages" : "/chat/completions";
    url = `${provider.baseURL}${path}`;
  }

  return { url, headers, body: JSON.stringify(bodyObj) };
}

/**
 * Parses the JSON response from any provider into a plain string.
 */
export function parseResponse(
  provider: ProviderConfig,
  rawResponse: unknown
): string {
  return provider.responseParser(rawResponse);
}

/**
 * Returns only the models that have a free tier for a given provider.
 */
export function getFreeModels(providerId: AIProvider): ProviderModel[] {
  return PROVIDERS[providerId].models.filter((m) => m.isFree);
}

/**
 * Returns all providers that don't require an API key or have free models.
 */
export function getAccessibleProviders(): ProviderConfig[] {
  return Object.values(PROVIDERS).filter(
    (p) => !p.requiresKey || p.freeModelsAvailable
  );
}
