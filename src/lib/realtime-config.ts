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

function trimEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

const CHAT_ONLY_DEPLOYMENT_HINT =
  /^(gpt-4o-mini|gpt-4o|gpt-4\.1-mini|gpt-4\.1|gpt-35-turbo|o1-mini|o1|o3-mini)$/i;

export function getRealtimeConfig(): RealtimeConfig | null {
  const azureEndpoint = trimEnv(process.env.AZURE_OPENAI_ENDPOINT);
  const azureKey = trimEnv(process.env.AZURE_OPENAI_API_KEY);
  const azureDeployment = trimEnv(process.env.AZURE_OPENAI_REALTIME_DEPLOYMENT);

  if (azureEndpoint && azureKey && azureDeployment) {
    const base = normalizeEndpoint(azureEndpoint);
    return {
      provider: "azure",
      apiKey: azureKey,
      clientSecretsUrl: `${base}/openai/v1/realtime/client_secrets`,
      webrtcCallsUrl: `${base}/openai/v1/realtime/calls`,
      model: azureDeployment,
      voiceOverride: trimEnv(process.env.AZURE_OPENAI_REALTIME_VOICE),
      authHeader: { "api-key": azureKey },
    };
  }

  const openaiKey = trimEnv(process.env.OPENAI_API_KEY);
  if (openaiKey && !openaiKey.includes("your-key")) {
    return {
      provider: "openai",
      apiKey: openaiKey,
      clientSecretsUrl: "https://api.openai.com/v1/realtime/client_secrets",
      webrtcCallsUrl: "https://api.openai.com/v1/realtime/calls",
      model:
        trimEnv(process.env.OPENAI_REALTIME_MODEL) ?? "gpt-4o-realtime-preview",
      voiceOverride: trimEnv(process.env.OPENAI_REALTIME_VOICE),
      authHeader: { Authorization: `Bearer ${openaiKey}` },
    };
  }

  return null;
}

export function validateRealtimeDeployment(
  provider: RealtimeProvider,
  model: string
): string | null {
  if (provider !== "azure") return null;

  if (CHAT_ONLY_DEPLOYMENT_HINT.test(model)) {
    return `AZURE_OPENAI_REALTIME_DEPLOYMENT is set to "${model}", which is a chat model. Use your realtime deployment name instead (e.g. gpt-realtime-2.1-mini).`;
  }

  if (!/realtime/i.test(model)) {
    return `AZURE_OPENAI_REALTIME_DEPLOYMENT="${model}" does not look like a realtime model. It must match your Azure realtime deployment exactly (e.g. gpt-realtime-2.1-mini).`;
  }

  return null;
}

export function resolveRealtimeVoice(
  personaVoice: string,
  config: RealtimeConfig
): string {
  return config.voiceOverride?.trim() || personaVoice;
}
