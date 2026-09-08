export type RealtimeProvider = "azure" | "openai";

export interface RealtimeConfig {
  provider: RealtimeProvider;
  apiKey: string;
  clientSecretsUrl: string;
  webrtcCallsUrl: string;
  model: string;
  voiceOverride?: string;
  authHeader: Record<string, string>;
}

function normalizeEndpoint(url: string): string {
  return url.replace(/\/+$/, "");
}

export function getRealtimeConfig(): RealtimeConfig | null {
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const azureKey = process.env.AZURE_OPENAI_API_KEY;
  const azureDeployment = process.env.AZURE_OPENAI_REALTIME_DEPLOYMENT;

  if (azureEndpoint && azureKey && azureDeployment) {
    const base = normalizeEndpoint(azureEndpoint);
    return {
      provider: "azure",
      apiKey: azureKey,
      clientSecretsUrl: `${base}/openai/v1/realtime/client_secrets`,
      webrtcCallsUrl: `${base}/openai/v1/realtime/calls`,
      model: azureDeployment,
      voiceOverride: process.env.AZURE_OPENAI_REALTIME_VOICE,
      authHeader: { "api-key": azureKey },
    };
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    return {
      provider: "openai",
      apiKey: openaiKey,
      clientSecretsUrl: "https://api.openai.com/v1/realtime/client_secrets",
      webrtcCallsUrl: "https://api.openai.com/v1/realtime/calls",
      model: process.env.OPENAI_REALTIME_MODEL ?? "gpt-4o-realtime-preview",
      voiceOverride: process.env.OPENAI_REALTIME_VOICE,
      authHeader: { Authorization: `Bearer ${openaiKey}` },
    };
  }

  return null;
}

export function resolveRealtimeVoice(
  personaVoice: string,
  config: RealtimeConfig
): string {
  return config.voiceOverride?.trim() || personaVoice;
}
