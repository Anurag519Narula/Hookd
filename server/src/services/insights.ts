import fetch from "node-fetch";

// ── YouTube Data API ───────────────────────────────────────────────────────────
export interface YouTubeResult {
  title: string;
  viewCount: string;
  likeCount: string;
  channelTitle: string;
  publishedAt: string;
}

export async function fetchYouTubeTrends(query: string): Promise<YouTubeResult[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return [];

  try {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&order=viewCount&maxResults=10&key=${apiKey}`;
    const searchRes = await fetch(searchUrl);
    const searchData = (await searchRes.json()) as any;

    if (!searchData.items?.length) return [];

    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(",");
    const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&key=${apiKey}`;
    const statsRes = await fetch(statsUrl);
    const statsData = (await statsRes.json()) as any;

    return (statsData.items ?? []).map((item: any) => ({
      title: item.snippet.title,
      viewCount: item.statistics.viewCount ?? "0",
      likeCount: item.statistics.likeCount ?? "0",
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
    }));
  } catch (err) {
    console.error("YouTube API error:", err);
    return [];
  }
}

// ── Google Trends (unofficial) ─────────────────────────────────────────────────
export interface TrendData {
  keyword: string;
  interest: number; // 0-100
  relatedQueries: string[];
}

export async function fetchGoogleTrends(_keyword: string): Promise<TrendData | null> {
  // Google Trends blocks server-side requests — disabled for now
  return null;
}
