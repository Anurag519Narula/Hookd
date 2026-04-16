import fetch from "node-fetch";
import Groq from "groq-sdk";
import { getCached, setCached } from "./dbCache";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface YouTubeResult {
  title: string;
  viewCount: string;
  likeCount: string;
  channelTitle: string;
  publishedAt: string;
  tags?: string[];
  description?: string;
}

export interface TrendData {
  keyword: string;
  interest: number;
  relatedQueries: string[];
}

export interface HashtagIntelligence {
  hashtags: string[];
  source: "youtube" | "groq_synthesis" | "mixed";
  youtubeVideoCount: number;
  instagramHashtagCount: number;
  confidence: "high" | "medium" | "low";
}

// ── Platform hashtag strategy (injected into Groq prompt) ─────────────────────

const PLATFORM_HASHTAG_STRATEGY: Record<string, string> = {
  instagram: `Instagram hashtag strategy:
- Use 3-5 hashtags with 500K–3M total posts (sweet spot for discovery)
- Use 3-4 hashtags with 100K–500K posts (niche authority)
- Use 2-3 hashtags with 10K–100K posts (micro-community, highest engagement)
- AVOID hashtags with 10M+ posts — content never surfaces there
- Include 1-2 community tags (e.g. #fitnesscommunity, #creatoreconomy)`,

  reels: `Instagram Reels hashtag strategy:
- Use 5-8 hashtags total (algorithm prefers fewer, targeted tags)
- 2-3 broad discovery tags (500K–5M posts)
- 3-4 niche-specific tags (50K–500K posts)
- Always include #reels or #reelsinstagram`,

  linkedin: `LinkedIn hashtag strategy:
- Use 3-5 hashtags maximum
- Prioritise hashtags with 1M+ followers on LinkedIn
- Mix: 1 broad industry tag, 1-2 role tags, 1 topic tag
- Avoid Instagram-style micro-niche tags`,

  youtube_shorts: `YouTube Shorts hashtag strategy:
- Use 3-5 hashtags in description
- Always include #shorts or #youtubeshorts
- Add 1-2 broad category hashtags
- Algorithm relies more on title than hashtags`,
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function extractKeywords(prompt: string): string[] {
  const cleaned = prompt
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(
      /\b(i|me|my|we|our|you|your|the|a|an|is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|could|should|may|might|shall|can|need|want|going|get|got|make|made|like|just|really|very|so|too|also|but|and|or|if|then|when|how|what|why|who|where|which|that|this|these|those|it|its|about|for|with|from|into|onto|upon|over|under|through|between|among|during|before|after|since|until|while|because|although|though|even|yet|still|already|now|here|there|up|down|out|off|on|in|at|by|to|of)\b/g,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();

  const words = cleaned.split(" ").filter((w) => w.length > 2);
  if (words.length === 0) return [prompt.slice(0, 50)];

  const keywords: string[] = [];
  if (words.length >= 2) keywords.push(words.slice(0, Math.min(5, words.length)).join(" "));
  if (words.length >= 3) keywords.push(words.slice(0, 3).join(" "));
  const longest = [...words].sort((a, b) => b.length - a.length)[0];
  if (longest && !keywords.some((k) => k.includes(longest))) keywords.push(longest);

  return [...new Set(keywords)].slice(0, 3);
}

function extractHashtagsFromYouTube(results: YouTubeResult[]): string[] {
  const hashtagSet = new Set<string>();
  for (const r of results) {
    (r.title.match(/#[\w]+/g) ?? []).forEach((t) => hashtagSet.add(t.toLowerCase()));
    if (r.description) {
      (r.description.match(/#[\w]+/g) ?? []).slice(0, 10).forEach((t) =>
        hashtagSet.add(t.toLowerCase())
      );
    }
    if (r.tags) {
      r.tags.slice(0, 5).forEach((tag) => {
        const normalized = "#" + tag.toLowerCase().replace(/\s+/g, "");
        if (normalized.length > 2 && normalized.length < 30) hashtagSet.add(normalized);
      });
    }
  }
  return Array.from(hashtagSet).slice(0, 20);
}

// ── Instagram public hashtag data (no API key required) ───────────────────────

async function fetchInstagramHashtagPostCount(
  hashtag: string
): Promise<{ hashtag: string; postCount: number } | null> {
  const tag = hashtag.replace(/^#/, "").toLowerCase();
  try {
    const url = `https://www.instagram.com/explore/tags/${encodeURIComponent(tag)}/`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const countMatch = html.match(/"edge_hashtag_to_media":\{"count":(\d+)/);
    if (countMatch) return { hashtag: `#${tag}`, postCount: parseInt(countMatch[1]) };
    const altMatch = html.match(/"media_count":(\d+)/);
    if (altMatch) return { hashtag: `#${tag}`, postCount: parseInt(altMatch[1]) };
    return null;
  } catch {
    return null;
  }
}

export async function fetchInstagramHashtagData(
  hashtags: string[]
): Promise<Array<{ hashtag: string; postCount: number; tier: "high" | "mid" | "niche" | "micro" }>> {
  const candidates = hashtags.slice(0, 8);
  const results = await Promise.allSettled(candidates.map((h) => fetchInstagramHashtagPostCount(h)));
  const validated: Array<{ hashtag: string; postCount: number; tier: "high" | "mid" | "niche" | "micro" }> = [];
  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      const { hashtag, postCount } = result.value;
      const tier =
        postCount >= 3_000_000 ? "high" :
        postCount >= 500_000 ? "mid" :
        postCount >= 50_000 ? "niche" : "micro";
      validated.push({ hashtag, postCount, tier });
    }
  }
  return validated.sort((a, b) => b.postCount - a.postCount);
}

// ── YouTube Data API ───────────────────────────────────────────────────────────

async function searchYouTube(query: string, maxResults = 8): Promise<YouTubeResult[]> {
  // DB cache — YouTube quota is precious, cache for 7 days
  const cached = await getCached<YouTubeResult[]>("youtube_search", { query, maxResults });
  if (cached) return cached;

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return [];

  try {
    const searchUrl =
      `https://www.googleapis.com/youtube/v3/search` +
      `?part=snippet&q=${encodeURIComponent(query)}&type=video` +
      `&order=relevance&maxResults=${maxResults}&key=${apiKey}`;

    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return [];

    const searchData = (await searchRes.json()) as any;
    if (!searchData.items?.length) return [];

    const videoIds = searchData.items
      .map((item: any) => item.id?.videoId)
      .filter(Boolean)
      .join(",");
    if (!videoIds) return [];

    const statsUrl =
      `https://www.googleapis.com/youtube/v3/videos` +
      `?part=statistics,snippet&id=${videoIds}&key=${apiKey}`;

    const statsRes = await fetch(statsUrl);
    if (!statsRes.ok) return [];

    const statsData = (await statsRes.json()) as any;

    const results: YouTubeResult[] = (statsData.items ?? []).map((item: any) => ({
      title: item.snippet?.title ?? "",
      viewCount: item.statistics?.viewCount ?? "0",
      likeCount: item.statistics?.likeCount ?? "0",
      channelTitle: item.snippet?.channelTitle ?? "",
      publishedAt: item.snippet?.publishedAt ?? "",
      tags: item.snippet?.tags ?? [],
      description: (item.snippet?.description ?? "").slice(0, 500),
    }));

    await setCached("youtube_search", { query, maxResults }, results);
    return results;
  } catch (err) {
    console.error("YouTube search error:", err);
    return [];
  }
}

export async function fetchYouTubeTrends(
  query: string,
  niche?: string
): Promise<YouTubeResult[]> {
  const keywords = extractKeywords(query);
  const searches: Promise<YouTubeResult[]>[] = [];

  searches.push(searchYouTube(keywords[0] ?? query, 8));

  if (niche && niche.trim()) {
    const nicheQuery = `${keywords[0] ?? query} ${niche}`.trim();
    if (nicheQuery !== keywords[0]) searches.push(searchYouTube(nicheQuery, 5));
  }

  if (keywords[1] && keywords[1] !== keywords[0]) {
    searches.push(searchYouTube(keywords[1], 5));
  }

  const allResults = (await Promise.all(searches)).flat();
  const seen = new Set<string>();
  const deduped = allResults.filter((r) => {
    const key = r.title.toLowerCase().slice(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduped
    .sort((a, b) => parseInt(b.viewCount) - parseInt(a.viewCount))
    .slice(0, 10);
}

// ── Groq hashtag synthesis ─────────────────────────────────────────────────────

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? "" });

async function synthesizeHashtagsWithGroq(params: {
  topic: string;
  niche: string | null;
  platforms: string[];
  existingHashtags?: string[];
  instagramValidated?: Array<{ hashtag: string; postCount: number; tier: string }>;
}): Promise<Record<string, string[]>> {
  const { topic, niche, platforms, existingHashtags = [], instagramValidated = [] } = params;

  const nicheContext = niche ? ` in the "${niche}" niche` : "";
  const strategyBlocks = platforms
    .map((p) => {
      const s = PLATFORM_HASHTAG_STRATEGY[p];
      return s ? `=== ${p.toUpperCase()} ===\n${s}` : null;
    })
    .filter(Boolean)
    .join("\n\n");

  const youtubeNote =
    existingHashtags.length > 0
      ? `\nHashtags from YouTube videos (use as signals): ${existingHashtags.slice(0, 8).join(", ")}`
      : "";

  const instagramNote =
    instagramValidated.length > 0
      ? `\nInstagram post counts:\n` +
        instagramValidated
          .map((h) => `  ${h.hashtag}: ${h.postCount.toLocaleString()} posts (${h.tier})`)
          .join("\n")
      : "";

  const prompt = `You are a platform-specific social media hashtag strategist.

TOPIC: "${topic}"${nicheContext}
PLATFORMS: ${platforms.join(", ")}
${youtubeNote}${instagramNote}

STRATEGIES:
${strategyBlocks}

Generate the optimal hashtag set for each platform. Apply volume tier rules strictly.
Every hashtag must start with #, be lowercase, no spaces.

Return ONLY valid JSON:
{
  ${platforms.map((p) => `"${p}": ["#tag1", "#tag2", ...]`).join(",\n  ")}
}`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 600,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as Record<string, string[]>;

    const validated: Record<string, string[]> = {};
    for (const [platform, tags] of Object.entries(parsed)) {
      if (Array.isArray(tags)) {
        validated[platform] = tags
          .filter((t): t is string => typeof t === "string")
          .map((t) => (t.startsWith("#") ? t.toLowerCase() : `#${t.toLowerCase()}`))
          .filter((t) => t.length > 2 && t.length < 35)
          .slice(0, 12);
      }
    }
    return validated;
  } catch (err) {
    console.error("Groq hashtag synthesis error:", err);
    return {};
  }
}

// ── Main entry point ───────────────────────────────────────────────────────────

export async function fetchHashtagIntelligence(params: {
  topic: string;
  niche: string | null;
  platforms: string[];
}): Promise<
  HashtagIntelligence & {
    perPlatform: Record<string, string[]>;
    summary: string;
    instagramValidated: Array<{ hashtag: string; postCount: number; tier: string }>;
  }
> {
  const { topic, niche, platforms } = params;

  // Check DB cache first
  const cacheParams = { topic: topic.toLowerCase().trim(), niche, platforms: [...platforms].sort() };
  const cached = await getCached<ReturnType<typeof fetchHashtagIntelligence> extends Promise<infer T> ? T : never>(
    "hashtag_intelligence",
    cacheParams
  );
  if (cached) return cached;

  const youtubeResults = await fetchYouTubeTrends(topic, niche ?? undefined);
  const youtubeHashtags = extractHashtagsFromYouTube(youtubeResults);
  const hasYouTubeData = youtubeResults.length > 0;

  const needsInstagram = platforms.some((p) => p === "instagram" || p === "reels");
  const instagramValidated = needsInstagram
    ? await fetchInstagramHashtagData(youtubeHashtags.slice(0, 8))
    : [];

  const groqHashtags = await synthesizeHashtagsWithGroq({
    topic,
    niche,
    platforms,
    existingHashtags: youtubeHashtags,
    instagramValidated,
  });

  const perPlatform: Record<string, string[]> = {};
  for (const platform of platforms) {
    const groqTags = groqHashtags[platform] ?? [];
    let ytTags: string[];
    if (platform === "instagram" || platform === "reels") {
      ytTags = instagramValidated
        .filter((h) => h.tier === "mid" || h.tier === "niche" || h.tier === "micro")
        .map((h) => h.hashtag)
        .slice(0, 4);
    } else {
      ytTags = youtubeHashtags.slice(0, 4);
    }
    const merged = [...ytTags, ...groqTags];
    const seen = new Set<string>();
    perPlatform[platform] = merged
      .filter((t) => {
        const k = t.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .slice(0, 12);
  }

  const summaryParts: string[] = [];
  if (hasYouTubeData) {
    summaryParts.push(
      `YouTube trend data:\n` +
        youtubeResults
          .slice(0, 3)
          .map((v, i) => `${i + 1}. "${v.title}" — ${parseInt(v.viewCount).toLocaleString()} views`)
          .join("\n")
    );
    if (youtubeHashtags.length > 0) {
      summaryParts.push(`Hashtags from top videos: ${youtubeHashtags.slice(0, 6).join(", ")}`);
    }
  }
  if (instagramValidated.length > 0) {
    const goodTags = instagramValidated.filter((h) => h.tier === "mid" || h.tier === "niche");
    if (goodTags.length > 0) {
      summaryParts.push(
        `Instagram post counts:\n` +
          goodTags.slice(0, 5).map((h) => `  ${h.hashtag}: ${h.postCount.toLocaleString()} posts`).join("\n")
      );
    }
  }

  const result = {
    hashtags: [...new Set([...youtubeHashtags, ...Object.values(groqHashtags).flat()])].slice(0, 20),
    source: (hasYouTubeData ? "mixed" : "groq_synthesis") as "mixed" | "groq_synthesis" | "youtube",
    youtubeVideoCount: youtubeResults.length,
    instagramHashtagCount: instagramValidated.length,
    confidence: (hasYouTubeData ? "high" : "medium") as "high" | "medium" | "low",
    perPlatform,
    summary: summaryParts.join("\n\n"),
    instagramValidated,
  };

  await setCached("hashtag_intelligence", cacheParams, result);
  return result;
}

// ── Google Trends ──────────────────────────────────────────────────────────────

export async function fetchGoogleTrends(_keyword: string): Promise<TrendData | null> {
  return null;
}
