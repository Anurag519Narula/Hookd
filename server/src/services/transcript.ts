import fetch from "node-fetch";
import { parseStringPromise } from "xml2js";

export function extractVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.slice(1).split("?")[0] || null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      return parsed.searchParams.get("v");
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchTranscript(url: string): Promise<string> {
  const videoId = extractVideoId(url);
  if (!videoId) {
    throw new Error("Invalid YouTube URL. Please use a youtube.com/watch or youtu.be link.");
  }

  // Step 1: Get the INNERTUBE_API_KEY from the video page
  const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
  const html = await pageRes.text();

  const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
  if (!apiKeyMatch) {
    throw new Error("Could not access YouTube. The video may be unavailable or private.");
  }
  const apiKey = apiKeyMatch[1];

  // Step 2: Call the Innertube player API impersonating Android client
  const playerRes = await fetch(
    `https://www.youtube.com/youtubei/v1/player?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        context: {
          client: {
            clientName: "ANDROID",
            clientVersion: "20.10.38",
          },
        },
        videoId,
      }),
    }
  );

  const playerData = (await playerRes.json()) as any;

  // Step 3: Extract caption track URL
  const tracks: Array<{ baseUrl: string; languageCode: string; kind?: string }> =
    playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];

  if (!tracks.length) {
    throw new Error("No captions found for this video. The video may not have captions enabled.");
  }

  // Prefer English manual, then English auto-generated, then first available
  const track =
    tracks.find((t) => t.languageCode === "en" && !t.kind) ||
    tracks.find((t) => t.languageCode === "en") ||
    tracks[0];

  const baseUrl = track.baseUrl.replace(/&fmt=\w+$/, "");

  // Step 4: Fetch and parse the caption XML
  const xmlRes = await fetch(baseUrl);
  const xml = await xmlRes.text();

  const parsed = await parseStringPromise(xml);
  const entries: Array<{ _: string }> = parsed?.transcript?.text ?? [];

  const text = entries
    .map((e) => (e._ ?? "").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) {
    throw new Error("Transcript appears to be empty. The video may not have readable captions.");
  }

  return text;
}
