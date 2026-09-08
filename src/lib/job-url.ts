import type { JobPosting } from "./types";

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(encoded: string): string {
  const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeJobForUrl(job: JobPosting): string {
  return toBase64Url(JSON.stringify(job));
}

export function decodeJobFromUrl(encoded: string): JobPosting | null {
  try {
    const json = fromBase64Url(encoded);
    const job = JSON.parse(json) as JobPosting;

    if (!job?.companyName || !job?.role || !job?.jobDescription) {
      return null;
    }

    return job;
  } catch {
    return null;
  }
}

export function buildApplyUrl(job: JobPosting, origin = ""): string {
  const base = origin || (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/apply?job=${encodeJobForUrl(job)}`;
}
