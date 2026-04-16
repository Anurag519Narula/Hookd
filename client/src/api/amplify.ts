import type { AmplifyRequest, CaptionResult } from "../types/index";
import { authHeaders } from "./auth";

export async function generateCaptions(request: AmplifyRequest): Promise<CaptionResult> {
  const res = await fetch("/api/amplify", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(request),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error ?? "Failed to generate captions");
  return body as CaptionResult;
}
