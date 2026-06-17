import { getProvider } from "../data/providers";
import type { AIConfig } from "../types";

export function isAIConfigured(config: AIConfig | null | undefined): boolean {
  if (!config?.model) return false;
  const provider = getProvider(config.provider);
  if (!provider.requiresKey) return true;
  return config.apiKey.trim().length > 0;
}
