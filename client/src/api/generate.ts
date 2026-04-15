import type { Platform, GenerateResponse } from "../types/index";
import { authHeaders } from "./auth";

export async function generateContent(rawContent: string, platforms: Platform[]): Promise<GenerateResponse> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ rawContent, platforms }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  return response.json() as Promise<GenerateResponse>;
}
