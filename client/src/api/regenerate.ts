import type { Platform, RegenerateResponse } from "../types/index";
import { authHeaders } from "./auth";

export async function regenerateContent(
  platform: Platform,
  rawContent: string
): Promise<RegenerateResponse> {
  const response = await fetch(`/api/regenerate/${platform}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ rawContent }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  return response.json() as Promise<RegenerateResponse>;
}
