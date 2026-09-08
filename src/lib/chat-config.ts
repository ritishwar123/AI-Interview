function normalizeEndpoint(url: string): string {
  return url.replace(/\/+$/, "");
}

function isPlaceholderKey(key: string): boolean {
  return (
    key.includes("your-key") ||
    key.includes("your-openai") ||
    key.includes("sk-your") ||
    key === "your-azure-api-key-here"
  );
}

export interface ChatApiConfig {
  url: string;
  headers: Record<string, string>;
  model: string;
  provider: "azure" | "openai";
}

export function getChatConfig(): ChatApiConfig | null {
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const azureKey = process.env.AZURE_OPENAI_API_KEY;
  const azureDeployment =
    process.env.AZURE_OPENAI_CHAT_DEPLOYMENT ??
    process.env.AZURE_OPENAI_FEEDBACK_DEPLOYMENT;

  const openaiKey = process.env.OPENAI_API_KEY;
  const hasOpenAi = Boolean(openaiKey && !isPlaceholderKey(openaiKey));

  // Prefer Azure chat only when a chat deployment is explicitly configured
  if (
    azureEndpoint &&
    azureKey &&
    azureDeployment &&
    !isPlaceholderKey(azureKey)
  ) {
    const base = normalizeEndpoint(azureEndpoint);
    return {
      provider: "azure",
      url: `${base}/openai/v1/chat/completions`,
      headers: {
        "api-key": azureKey,
        "Content-Type": "application/json",
      },
      model: azureDeployment,
    };
  }

  if (hasOpenAi) {
    return {
      provider: "openai",
      url: "https://api.openai.com/v1/chat/completions",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      model: process.env.OPENAI_FEEDBACK_MODEL ?? "gpt-4o-mini",
    };
  }

  return null;
}

export async function createChatCompletion(body: {
  messages: { role: string; content: string }[];
  temperature?: number;
  response_format?: { type: string };
}) {
  const chat = getChatConfig();
  if (!chat) {
    throw new Error(
      "Chat API not configured. Set OPENAI_API_KEY for evaluation, or AZURE_OPENAI_CHAT_DEPLOYMENT with your Azure endpoint/key."
    );
  }

  const response = await fetch(chat.url, {
    method: "POST",
    headers: chat.headers,
    body: JSON.stringify({
      model: chat.model,
      ...body,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    try {
      const parsed = JSON.parse(errorText) as {
        error?: { message?: string; code?: string };
      };
      const msg = parsed.error?.message ?? errorText;
      const code = parsed.error?.code;
      if (code === "DeploymentNotFound") {
        throw new Error(
          `Azure chat deployment "${chat.model}" not found. Deploy a chat model (e.g. gpt-4o-mini) in Azure AI Foundry and set AZURE_OPENAI_CHAT_DEPLOYMENT to its deployment name.`
        );
      }
      throw new Error(msg);
    } catch (e) {
      if (e instanceof Error && e.message.includes("Azure chat deployment")) throw e;
      throw new Error(errorText);
    }
  }

  return response.json();
}
