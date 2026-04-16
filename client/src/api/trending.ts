export interface TrendingHashtag {
  hashtag: string;
  postCount: number;
  category?: string;
}

export async function fetchTrendingHashtags(): Promise<TrendingHashtag[]> {
  const res = await fetch("/api/trending");
  if (!res.ok) return [];
  const data = await res.json().catch(() => ({ hashtags: [] }));
  return (data.hashtags ?? []) as TrendingHashtag[];
}
