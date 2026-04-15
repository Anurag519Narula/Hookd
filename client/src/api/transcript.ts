import { authHeaders } from "./auth";

export async function fetchTranscript(url: string): Promise<string> {
  const response = await fetch("/api/transcript", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ url }),
  });

  const data = await response.json() as { transcript?: string; error?: string };

  if (!response.ok || data.error) {
    throw new Error(data.error ?? "Failed to fetch transcript");
  }

  return data.transcript!;
}
